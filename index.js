const fs = require('fs');
const csv = require('csvtojson');
const camelCase = require('lodash.camelcase');

const csvFilePath = './csv';
const outputPath = './dist'

let mkDirPromise;
if (!fs.existsSync(outputPath)){
    mkDirPromise = new Promise((resolve, reject) => {
        fs.mkdir(outputPath, (error) => {
            if(error) {
                reject(error);
            } else {
                resolve();
            }
        });
    })
} else {
    mkDirPromise = Promise.resolve();
}

fs.readdir(csvFilePath, function(error, items) {
    if(error) {
        throw new Error('Failed to retrieve CSV paths');
    }
    console.log(items);
    const writePromises = items.map(item => writeJson(`${csvFilePath}/${item}`));
    Promise.all(writePromises)
        .then(results => results.map(result => console.log('JSON produced:',result)));
});

const writeJson = (filePath) => {
    return new Promise((resolve, reject) => {
        const rows = [];
        const slashPosition = filePath.lastIndexOf('/')+1;
        const periodPosition = filePath.lastIndexOf('.');
        const filename = filePath.slice(slashPosition, periodPosition);
        console.log(`Starting conversion`, {filePath, filename});
        csv()
            .fromFile(filePath)
            .on('json', (jsonObj) => {
                console.log('Processing row:', jsonObj);
                const keys = Object.keys(jsonObj);
                const newObj = keys.reduce((newObj, key) => {
                    const newKey = camelCase(key);
                    newObj[newKey] = jsonObj[key];
                    return newObj;
                },{});
                rows.push(newObj);
            })
            .on('done',(error)=>{
                if(error) {
                    reject('CSV failed to compile:',error);
                }
                mkDirPromise.then(() => {
                    const filePath = `${outputPath}/${filename}.json`;
                    const fileContentsString = JSON.stringify(rows);
                    fs.writeFile(filePath, fileContentsString, function(err) {
                        if(err) {
                            reject('File write failed',error);
                        }
                        resolve(`CSV written: ${filePath}`);
                    });
                });
            })
    })
};
