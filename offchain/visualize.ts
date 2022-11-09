/// a program to generate an visualization of the lamport signature


import { writeFile } from 'fs'
import { mk_key_pair, sign_hash, hash, hash_b, verify_signed_hash } from './functions'
import { BigNumber } from 'bignumber.js'
const key_pair = mk_key_pair()
const message = 'hello world'
const hmsg = hash(message)
const sig = sign_hash(hmsg, key_pair.pri)
const is_valid_sig = verify_signed_hash(hmsg, sig, key_pair.pub)

console.log(`is_valid_sig: ${is_valid_sig}`)
type BinaryDigits = '0' | '1'

// convet hmsg to binary
const hmsg_bin = new BigNumber(hmsg, 16).toString(2).padStart(256, '0')
console.log(`hmsg_bin: ${hmsg_bin}`)

// const ways : LeftOrRight[] = hmsg_bin.split('').map((el: string) => el === '0' ? 'left' : 'right') as LeftOrRight[]
const ways : BinaryDigits [] = hmsg_bin.split('') as BinaryDigits []
console.log(`ways: ${ways}`)

// create a 2x256 array of 0
const arr = Array.from({ length: 2 }, () => Array.from({ length: 256 }, () => '0'))

for (let i = 0; i < 256; i++) {
    arr[ways[i]][i] = '1'
}

console.log(arr)



const pixelGrid = arr.map((row: string[]) => row.map((el: string) => `${el} `).join('')).join('')


// convert to .pbm format
const pbm = `P1
256 2
${pixelGrid}`


// write to file system
writeFile('lamport.pbm', pbm, (err) => {
    if (err) throw err
    console.log('The file has been saved!');
})

// convert to html table
const html = `<table>
${arr.map((row: string[]) => `<tr>${row.map((el: string) => `<td>${el}</td>`).join('')}</tr>`).join('')}
</table>`
writeFile('lamport.html', html, (err) => {
    if (err) throw err
    console.log('The file has been saved!');
})  