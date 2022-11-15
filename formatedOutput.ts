import { unzipN, df, cpylck } from "freshpauligroup";

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

const DEFAULT_padding_char = " "
// const padFunction = (str : string, length : number, pad_char : string) => str.padEnd(length, pad_char)
type PadFunc = (arg1 : string, arg2 : number, arg3 : string) => string
const DEFAULT_padFunction : PadFunc = (str : string, length : number, pad_char : string) => str.padStart(length, pad_char)


/**
 *  @name formatOutput
 *  @description takes an array of arrays of strings and formats it into a table 
 *  @date November 9th 2022
 *  @author William Doyle 
 */
export default function formatOutput(__data: string[][], padFunction : PadFunc = DEFAULT_padFunction, padding_char : string = DEFAULT_padding_char ): void {
    const _data = cpylck(__data) as string[][]
    const longest_length: number = Math.max(...(_data.map((row) => row.length)))

    const coloum_widths: number[] = (Array.from({ length: longest_length })).map((_, i) => {
        const column: string[] = (unzipN<string>(_data) as string[][])[i]
        return Math.max(...(column.map((cell) => cell.length)))
    })

    let output = ``
    const data = _data.map((row) => {
        if (row.length < longest_length) {
            const diff = longest_length - row.length
            return [...row, ...Array.from({ length: diff }, () => '')]
        }
        return row
    })

    let maxlinelength = 0
    for (let i = 0; i < data.length; i++) {
        let line = ``
        for (let k = 0; k < data[i].length; k++)
            // line += `${box_drawings.light.v} ${data[i][k].padEnd(coloum_widths[k], padding_char)} `
            line += `${box_drawings.light.v} ${padFunction(data[i][k], coloum_widths[k], padding_char)} `
        if (line.length > maxlinelength)
            maxlinelength = line.length

        output += (`${line}${box_drawings.light.v}\n`)
    }

    if (maxlinelength === 0)
        return

    const [top_line, bottom_line] = (() => {
        const prev_line = output.split(`\n`)[0]
        const indexes = prev_line.split(``).map((char, i) => [char, i]).filter(([char, i]) => char === box_drawings.light.v).map(([char, i]) => i)

        const default_top = `${box_drawings.light.tl}${box_drawings.light.h.repeat(maxlinelength - 1)}${box_drawings.light.tr}`
        const default_bottom = `${box_drawings.light.bl}${box_drawings.light.h.repeat(maxlinelength - 1)}${box_drawings.light.br}`

        if (indexes.length < 3)
            return [default_top, default_bottom]

        // discard first and last elements of the array
        const _indexes = indexes.slice(1, indexes.length - 1)

        const insert_junctions = (line: string, jchar: string) => {
            return line.split(``).map((char, i) => {
                if (_indexes.includes(i))
                    return jchar
                return char
            }).join(``)
        }

        const top_line = insert_junctions(default_top, box_drawings.light.top_junction)
        const bottom_line = insert_junctions(default_bottom, box_drawings.light.bottom_junction)
        return [top_line, bottom_line]
    })()

    output = `${top_line}\n${output}${bottom_line}\n`

    process.stdout.write(output)
}
