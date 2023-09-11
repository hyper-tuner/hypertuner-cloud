const Pako = require('pako');

// get file from command line
const file = process.argv[2];

// read file
const fs = require('fs');
const data = fs.readFileSync(file);
const result = Pako.inflate(data, { to: 'string' });

// write file with suffix .decompressed
const path = require('path');
const basename = path.basename(file);
const extname = path.extname(file);
const filename = basename.slice(0, -extname.length);
const newFile = `${filename}.decompressed${extname}`;

fs.writeFileSync(newFile, result);
