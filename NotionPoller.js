/***
 * npm install @notionhq/client
 * npm install dotenv
 */
const { Client } = require('@notionhq/client');
const extractor = require('./extractor.js');
require('dotenv').config();

var g_PageIDs = {}
var g_PageQ = []
var odbSession = null

const notion = new Client({
    auth: process.env.NOTION_API_TOKEN
});

// extract plain text field within a nested obj
const getPropValues = (o, prop) => 
  (res => (JSON.stringify(o, (key, value) => 
    (key === prop && res.push(value), value)), res))([]);
  
// Sync wrapper for the above function    
const getPropValuesSync = (o, prop) => {
    return new Promise(function(resolve) {
        resolve(getPropValues(o, prop))
    })
}

const getDatabases = async () => {
    const databases = await notion.databases.list();
    console.log(databases);
};

const trackPageIDs = async (pages) => {
    for(let i=0; i < pages.length; i++){        
        if(pages[i].id in g_PageIDs) continue;
        g_PageIDs[pages[i].id] = 1
        g_PageQ.push(pages[i].id)
        console.log('enQ ' + pages[i].id)
        let p = pages[i]
        delete p.properties
        delete p.parent
        delete p.icon
        delete p.cover        
        odbSession.command('UPDATE Entry MERGE ' + JSON.stringify(p) + ' UPSERT WHERE id = "' + p.id + '"')
    }
    console.log('total id: ' + Object.keys(g_PageIDs).length)
}

const PollPages = async () => {
    let data = await notion.databases.query({
        database_id: process.env.DB_ID
    });
    console.log(data.results.length)
    trackPageIDs(data.results)
    console.log(data)
    while(data.has_more){
        data = await notion.databases.query({
            database_id: process.env.DB_ID,
            start_cursor: data.next_cursor
        });
        trackPageIDs(data.results)
    }
}

const getPage = async (page_id) => {
    return new Promise(async function(resolve) {
        let text = ""
        let has_more = true
        let has_cursor = false
        while(has_more) {
            if(has_cursor){
                data = await notion.blocks.children.list({ block_id: page_id, start_cursor: data.next_cursor })                        
            }
            else {
                data = await notion.blocks.children.list({ block_id: page_id })                        
            }
            for(let i = 0; i < data.results.length; i++){                            
                let res = await getPropValuesSync(data.results[i], "plain_text");
                if(res.length > 0){
                    console.log(i + ' : ' + res)
                    text = text + " " + res
                }                
            }
            has_more = data.has_more
            has_cursor = data.next_cursor
        }
        resolve(text)
    })
}

const test = async () => {
    let t = await getPage('b1b57324db24495eb36a08d51e0726fc')
    console.log(t)
}

async function newPageHandler(newEvent) {
    // only interested in CREATED event ie. operations = 1
    if(newEvent['operation'] != 1) return; 
    // TODO
    // - use page id, getPage
    // - extract words from getPage content
    // use words output, call ODB function
}

(async () => {
    /*const odb = new (require('./odb').Odb)();
    odbSession = await odb.startSession()
    console.log("ODB session started!")
    odb.startLiveQuery("select from Entry", newPageHandler)
    setInterval(()=>{ PollPages() }, 20000) */
    
    let words = await extractor.extract("Cancer affects millions of Americans, and the number of cases is steadily rising. \
    The increase in diagnosis of cancer cases comes with an associated increase in personal and economic burden. \
    Earlier detection can improve treatment outcomes and may reduce the burden of cancer. Screening for cervical cancer \
    is a good example of the potential of effective screening methods to dramatically reduce the morbidity and mortality associated \
    with cancer. However, many current screening methods have high false-positive rates, increasing the concern for overdiagnosis and \
    overtreatment. Blood-based tests capable of detecting multiple types of cancer represent an emerging approach to early cancer detection. \
    Although there are several single-cancer detection tests in development, multicancer screening tests have greater potential to allow \
    for widespread screening in the general population. Three multicancer screening tests are being validated in ongoing clinical trials, \
    including the CancerSEEK assay, the Galleri test, and the PanSeer assay, all of which show high specificity in preliminary findings. \
    Further validation is required before multicancer detection tests are incorporated into general population cancer screening.")
    // will need stop VERB filtering
    console.log(words)
})()