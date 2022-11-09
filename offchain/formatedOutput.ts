import { df, cpylck, unzipN } from "./functions";

export default function formatOutput(__data: string[][]): void {
    const _data = cpylck(__data) as string[][]
    const longest_length: number = Math.max(...(_data.map((row) => row.length)))
    console.log(`longest length: ${longest_length}`)

    const coloum_widths: number[] = (Array.from({ length: longest_length })).map((_, i) => {
        const column = (unzipN<string>(_data) as string[][])[i]
        console.log(column)
        return Math.max(...(column.map((cell) => cell.length)))
    })
    console.log(`coloum widths: ${coloum_widths}`)
    console.table(_data);

    let output = ``
    const data = df(_data.map((row) => {
        if (row.length < longest_length) {
            const diff = longest_length - row.length
            return [...row, ...Array.from({ length: diff }, () => '')]
        }
        return row
    }))
    // display the data
    let maxlinelength = 0
    for (let i = 0; i < data.length; i++) {
        let line = ``
        for (let k = 0; k < data[i].length; k++) {
            line += `| ${data[i][k].padEnd(coloum_widths[k], '.')} `
        }
        if (line.length > maxlinelength)
            maxlinelength = line.length

        output += (`${line}|`)
        output += (`\n`)
    }

    // output = `⌜${'_'.repeat(maxlinelength - 1)}⌝\n${output}`
    output = ` ${'_'.repeat(maxlinelength - 1)}\n${output}`
    output += `⌊${'_'.repeat(maxlinelength - 1)}⌋`
    output += `\n`

    // output += (output)
    process.stdout.write(output)

}



