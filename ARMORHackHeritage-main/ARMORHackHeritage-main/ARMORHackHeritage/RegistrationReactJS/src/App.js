import './App.css';
import { useState } from 'react';
import axios from 'axios';

function App() {

  const [userID, setUserID] = useState('');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [contact1, setContact1] = useState('');
  const [contact2, setContact2] = useState('');
  const [contact3, setContact3] = useState('');

  const handleClick = async () => {
    try {
      // Trim input values and default to space if empty
      const trimmedUserID = userID.trim();
      const trimmedPin = pin.trim();
      const trimmedEmail = email.trim();
      const trimmedContact1 = contact1.trim() || ' ';
      const trimmedContact2 = contact2.trim() || ' ';
      const trimmedContact3 = contact3.trim() || ' ';

      // Construct URL with parameters
      let url = `http://localhost:5000/register/${trimmedUserID}/${trimmedPin}/${trimmedEmail}/${trimmedContact1}`;

      // Add contact2 and contact3 only if they are not empty
      if (trimmedContact2 !== ' ') {
        url += `/${trimmedContact2}`;
      } else {
        url += '/ ';
      }
      
      if (trimmedContact3 !== ' ') {
        url += `/${trimmedContact3}`;
      } else {
        url += '/ ';
      }

      console.log(url);

      // Make the POST request
      const response = await axios.post(url);
      console.log('Response:', response.data);
      alert('Registration successful!');
    } catch (error) {
      console.error('Error:', error);
      alert('Registration failed. Please try again.');
    }
  };

  return (
    <div className="App">
      <h1>Register User</h1>
      <div className='Inside'>
        <form>
          <input
            type='text'
            placeholder='Enter User ID'
            onChange={(event) => setUserID(event.target.value)}
          />
          <p></p>
          <input
            type='text'
            placeholder='PIN'
            onChange={(event) => setPin(event.target.value)}
          />
          <p></p>
          <input
            type='email'
            placeholder='Email ID'
            onChange={(event) => setEmail(event.target.value)}
          />
          <p></p>
          <input
            type='text'
            placeholder='Aadhaar Number'
          />
          <p>Please Submit your Passport: </p>
          <input
            type='file'
          />
          <p></p>
          <input
            type='text'
            placeholder='Contact-1'
            onChange={(event) => setContact1(event.target.value)}
          />
          <p></p>
          <input
            type='text'
            placeholder='Contact-2'
            onChange={(event) => setContact2(event.target.value)}
          />
          <p></p>
          <input
            type='text'
            placeholder='Contact-3'
            onChange={(event) => setContact3(event.target.value)}
          />
          <p></p>
          <button
            type='button'
            onClick={handleClick}
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
