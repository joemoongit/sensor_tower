const fs = require('node:fs');
const { execSync } = require('node:child_process');

const dict = new Set([ 'orlando', 'cerritos', 'los', 'georgetown', 'cruz', 'jc', 'penn', 'childrens' ]);    // extend /usr/share/dict/words
const group = new Set([ 'childrens_hospital' ]);        // define unique names to be grouped
const advertisers = {};

const inDictionary = function(word) {
    var output = execSync(`grep -e '^${word}$' /usr/share/dict/words | wc -l`);

    // format output
    output = Number(output.toString().trim())
    return output === 1;
};

fs.readFile('./advertisers.txt', 'utf-8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }

    // convert buffer object to string
    data = data.toString();

    // advertisers are delimited with \r\n
    data = data.split('\r\n');

    // iterate through advertisers and perform check for duplicate names by checking for uniqueness
    data.forEach((advertiser) => {
        var chars = [];
        var name = [];

        for (var char of advertiser) {
            
            // ignore -, _, ', or comma characters
            if (/[-_',.]/.test(char)) {
                continue;
            }

            // if character is whitespace, check uniqueness of word
            if (/\s/.test(char)) {

                // handles edge case where there is a typo and there are two or more white spaces in between words
                if (!chars.length) {
                    continue;
                }

                var word = chars.join('');
                name.push(word);
                chars.length = 0;

                // continue if word contains only numbers or characters such as & (characters that are not found in dictionary and do not denote uniqueness)
                if (/^\d+$/.test(word) || /[&]/.test(word)) {
                    continue;
                }

                // if word in not dictionary, determine it is a unique name, and add name to advertisers object
                if ((!inDictionary(word) && !dict.has(word)) || group.has(name.join('_'))) {
                    break;
                }
            } else {
                chars.push(char.toLowerCase());
            }
        }

        if (chars.length) {
            name.push(chars.join(''));
        }

        name = name.join('_');
        advertisers[name] ? advertisers[name].push(advertiser) : advertisers[name] = [ advertiser ];
    });

    // format output
    var potentialDuplicates = Object
                                .entries(advertisers)
                                .filter(([ _, value ]) => value.length > 1)
                                .map((name) => name[1].join('\n'))
                                .join('\n\n');
    
    fs.writeFileSync('./potential_duplicates.txt', potentialDuplicates);
});
