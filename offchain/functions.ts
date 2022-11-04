import { KeyPair, RandPair, Sig, PubPair } from "./Types"
import BigNumber from "bignumber.js"
import { randomBytes } from 'crypto'
import { ethers } from 'ethers';

const hash = (input: string) => ethers.utils.keccak256(ethers.utils.toUtf8Bytes(input))
const hash_b = (input: string) => ethers.utils.keccak256(input)

/**
 * 
 * @param pri 
 * @returns PubPair[] (the public key)
 */
const pubFromPri = (pri: [string, string][]) => pri.map(p => ([hash_b(p[0]), hash_b(p[1])])) as PubPair[]

export { hash, hash_b, pubFromPri }

/**
 * @name mk_key_pair
 * @description Generate a lamport keypair using the randomBytes function from the crypto library to generate the private key
 * @author William Doyle
 * @returns a random lamport key pair
 */
export function mk_key_pair(): KeyPair {
    const mk_rand_num = () => hash(randomBytes(32).toString('hex')).substring(2) // hash the random number once to get the private key (then forget the original random number) and twice to get the public key... this helps if there is an issue with the random number generator
    const mk_RandPair = () => ([mk_rand_num(), mk_rand_num()] as RandPair)
    const mk_pri_key = () => Array.from({ length: 256 }, () => mk_RandPair()) as RandPair[]

    const pri = mk_pri_key()
    const pub = pubFromPri(pri.map(p => [`0x${p[0]}`, `0x${p[1]}`]))
    return { pri, pub }
}

/**
 * @name is_private_key
 * @description check the passed object looks like a lamport private key
 * @author William Doyle
 * @param key 
 * @returns boolean if key looks like a valid lamport key pair
 */
export function is_private_key(key: RandPair[]): boolean {
    if (key.length !== 256)
        return false
    return true
}

/**
 * @name sign_hash
 * @author William Doyle 
 * @param hmsg --> the hash of the message to be signed 
 * @param pri --> the private key to sign the hash with 
 * @returns Sig (a lamport signature)
 */
export function sign_hash(hmsg: string, pri: RandPair[]): Sig {
    if (!is_private_key(pri))
        throw new Error('invalid private key')

    const msg_hash_bin = new BigNumber(hmsg, 16).toString(2).padStart(256, '0')

    if (msg_hash_bin.length !== 256)
        throw new Error(`invalid message hash length: ${msg_hash_bin.length} --> ${msg_hash_bin}`)

    const sig: Sig = ([...msg_hash_bin] as ('0' | '1')[]).map((el: '0' | '1', i: number) => pri[i][el])
    return sig
}

/**
 * @name verify_signed_hash
 * @author William Doyle
 * @param hmsg 
 * @param sig 
 * @param pub 
 * @returns a boolean : true upon successful verification, false otherwise
 */
export function verify_signed_hash(hmsg: string, sig: Sig, pub: PubPair[]): boolean {
    const msg_hash_bin = new BigNumber(hmsg, 16).toString(2).padStart(256, '0')
    const pub_selection = ([...msg_hash_bin] as ('0' | '1')[]).map((way /** 'way' as in which way should we go through the public key */: '0' | '1', i: number) => pub[i][way])

    for (let i = 0; i < pub_selection.length; i++)
        if (pub_selection[i] !== hash_b(`0x${sig[i]}`))
            return false

    return true
}