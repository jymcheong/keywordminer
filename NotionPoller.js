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
    
    let words = await extractor.extract("Tissue adhesives do not normally perform well on tissues that are covered with blood or other bodily fluids. Here we report the design, adhesion mechanism and performance of a paste that haemostatically seals tissues in less than 15 s, independently of the blood-coagulation rate. With a design inspired by barnacle glue (which strongly adheres to wet and contaminated surfaces owing to adhesive proteins embedded in a lipid-rich matrix), the paste consists of a blood-repelling hydrophobic oil matrix containing embedded microparticles that covalently crosslink with tissue surfaces on the application of gentle pressure. It slowly resorbs over weeks, sustains large pressures (approximately 350 mm Hg of burst pressure in a sealed porcine aorta), makes tough (interfacial toughness of 150–300 J m−2) and strong (shear and tensile strengths of, respectively, 40–70 kPa and 30–50 kPa) interfaces with blood-covered tissues, and outperforms commercial haemostatic agents in the sealing of bleeding porcine aortas ex vivo and of bleeding heart and liver tissues in live rats and pigs. The paste may aid the treatment of severe bleeding, even in individuals with coagulopathies.")
    // will need stop words filtering
    console.log(words)
})()