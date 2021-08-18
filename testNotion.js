/***
 * npm install @notionhq/client
 * npm install dotenv
 */
const { Client } = require('@notionhq/client');
require('dotenv').config();

var g_PageIDs = {}
var g_PageQ = []

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
    }
    console.log('total id: ' + Object.keys(g_PageIDs).length)
}

const getAllPages = async () => {
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
//https://www.notion.so/jymcheong/Track-Job-Applications-With-Notion-API-Node-js-and-FastifyJS-bf1880e9853e40448a0d9e0f9e3dea81
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

//getAllPages()

setInterval(()=>{ getAllPages() }, 20000)

//test()
