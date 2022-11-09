import { df, cpylck, unzipN } from "./functions";

export default function formatOutput(_data: string[][]): void {
    const data = cpylck(_data) as string[][]
    const longest_length: number = Math.max(...(data.map((row) => row.length)))
    console.log(`longest length: ${longest_length}`)

    const coloum_widths: number[] = (Array.from({ length: longest_length })).map((_, i) => {
        const column = (unzipN<string>(data) as string[][])[i]
        console.log(column)
        return Math.max(...(column.map((cell) => cell.length)))
    })
    console.log(`coloum widths: ${coloum_widths}`)
    console.table(data);
}



