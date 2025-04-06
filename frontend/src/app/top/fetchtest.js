export default async function fetchtest(){
    const res = await fetch(process.env.NEXT_PUBLIC_API_ENDPOINT+'/')
    return res.json();
}