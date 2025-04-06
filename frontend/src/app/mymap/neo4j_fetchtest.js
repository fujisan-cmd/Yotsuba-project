export default async function neo4j_fetchtest(){
    const res = await fetch(process.env.NEXT_PUBLIC_API_ENDPOINT+'/graph_info')
    return res.json();
}