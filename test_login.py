import urllib.request
import json
import urllib.error

data = json.dumps({'email': 'patient@test.com', 'password': 'judge123'}).encode()
req = urllib.request.Request('http://127.0.0.1:5000/api/auth/login', data=data, headers={'Content-Type': 'application/json'})

try:
    response = urllib.request.urlopen(req)
    print("SUCCESS! Status:", response.status)
    print("Body:", response.read().decode())
except urllib.error.HTTPError as e:
    with open('error.html', 'w') as f:
        f.write(e.read().decode())
    print("Wrote error.html")
