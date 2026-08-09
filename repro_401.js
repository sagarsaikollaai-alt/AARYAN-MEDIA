async function test() {
    const response = await fetch('http://localhost:3001/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            amount: 2999,
            course_id: "course-2",
            user_id: "aaryanmedia29@gmail.com",
            user_name: "Aaryan Media",
            user_email: "aaryanmedia29@gmail.com",
            user_phone: "9391088126"
        })
    });
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(data, null, 2));
}
test();
