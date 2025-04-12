export default async function fetchSearch(input){
    const res = await fetch(process.env.NEXT_PUBLIC_API_ENDPOINT+`/search?q=${input}`)
    return res.json();
}