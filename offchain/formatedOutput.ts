import { df, cpylck, unzipN } from "./functions";

const box_drawings = {
    light: {
        h: "─",
        v: "│",
        tl: "┌",
        tr: "┐",
        bl: "└",
        br: "┘",
        top_junction: "┬",
        bottom_junction: "┴",
    }
}

export default function formatOutput(__data: string[][]): void {
    const _data = cpylck(__data) as string[][]
    const longest_length: number = Math.max(...(_data.map((row) => row.length)))

    const coloum_widths: number[] = (Array.from({ length: longest_length })).map((_, i) => {
        const column = (unzipN<string>(_data) as string[][])[i]
        return Math.max(...(column.map((cell) => cell.length)))
    })

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
            // line += `| ${data[i][k].padEnd(coloum_widths[k], '.')} `
            line += `${box_drawings.light.v} ${data[i][k].padEnd(coloum_widths[k], '.')} `
        }
        if (line.length > maxlinelength)
            maxlinelength = line.length

        // output += (`${line}|`)
        output += (`${line}${box_drawings.light.v}`)
        output += (`\n`)
    }

    // output = `⌜${'_'.repeat(maxlinelength - 1)}⌝\n${output}`
    // output = ` ${'_'.repeat(maxlinelength - 1)}\n${output}`
    // output = ` ${box_drawings.light.h.repeat(maxlinelength - 1)}\n${output}`
    output = `${box_drawings.light.tl}${box_drawings.light.h.repeat(maxlinelength - 1)}${box_drawings.light.tr}\n${output}`
    // output += `⌊${'_'.repeat(maxlinelength - 1)}⌋`
    output += `${box_drawings.light.bl}${box_drawings.light.h.repeat(maxlinelength - 1)}${box_drawings.light.br}`
    output += `\n`

    // output += (output)
    process.stdout.write(output)

}



