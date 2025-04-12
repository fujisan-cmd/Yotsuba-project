export default async function login(email, password){
    const res = await fetch(process.env.NEXT_PUBLIC_API_ENDPOINT+'/api/login', 
        {
            method: 'POST',
            headers: {'Content-Type': 'application/json',},
            body: JSON.stringify({email, password}),
        }
    );
    return res.json();
}