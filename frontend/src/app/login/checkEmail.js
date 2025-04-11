export default async function checkEmail(email){
    const res = await fetch(process.env.NEXT_PUBLIC_API_ENDPOINT+'/api/check-email',
        {
            method: 'POST',
            headers: {'Content-Type': 'application/json',},
            body: JSON.stringify({email}),
        }
    );
    return res.json();
}