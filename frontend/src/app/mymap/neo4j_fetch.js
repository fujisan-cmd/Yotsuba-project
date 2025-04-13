export default async function neo4j_fetch(token){
    const res = await fetch(process.env.NEXT_PUBLIC_API_ENDPOINT+'/graph_info',
        {
            headers: {Authorization: `Bearer ${token}`,},
        } 
    );
    return res.json();
}