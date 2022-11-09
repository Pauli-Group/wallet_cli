export default function formatOutput (data : string[][]) : string {
    const longest_length : number = Math.max(...(data.map((row) => row.length)));
    console.log(longest_length);


    return ""
}