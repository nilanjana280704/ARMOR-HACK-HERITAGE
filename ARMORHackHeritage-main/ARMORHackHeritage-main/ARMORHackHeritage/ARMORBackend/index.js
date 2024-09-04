const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const port = 3000;

app.use(cors({ origin: true })); // Enable CORS
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'jibiteshheva@gmail.com',
    pass: 'ioof kgjf oupe ickr'
  }
});

let userLocations = {
  Jibitesh: {
    latitude: 22.5273341,
    longitude: 88.3717237,
    timestamp: '2024-07-17T05:48:36.739Z'
  },
  Nilanjana: {
    latitude: 22.5273341,
    longitude: 88.3717237,
    timestamp: '2024-07-17T05:54:00.752Z'
  },
  Ashmit: {
    latitude: 22.5273341,
    longitude: 88.3717237,
    timestamp: '2024-07-17T05:55:16.871Z'
  },
  Mohak: {
    latitude: 22.5273341,
    longitude: 88.3717237,
    timestamp: '2024-07-17T06:17:58.643Z'
  },
  Sagnik: {
    latitude: 22.5273341,
    longitude: 88.3717237,
    timestamp: '2024-07-17T06:17:58.643Z'
  },
  Anusha: {
    latitude: 22.5273341,
    longitude: 88.3717237,
    timestamp: '2024-07-17T06:17:58.643Z'
  }
}; // In-memory storage for user locations

let panic = {};

const users = [
  {
    id: 'Jibitesh',
    pin: 'Jibimax@123',
    email: 'jibitesh.chakraborty.281102@gmail.com',
    emergency:['jibiteshchakraborty74984@gmail.com']
  },
  {
    id: 'Nilanjana',
    pin: 'Nilanjana',
    email: 'nilanjana.dutta.cse27@heritageit.edu.in',
    emergency:['nilanjanadutta2004@gmail.com']
  },
  {
    id: 'Mohak',
    pin: 'Mohak',
    email: 'mohak.sarkar.cse27@heritageit.edu.in',
    emergency:['mohaksarkar9733@gmail.com']
  },
  {
    id: 'Ashmit',
    pin: 'Ashmit',
    email: 'ashmit.paul.cse27@heritageit.edu.in',
    emergency:['shan04p@gmail.com']
  },
  {
    id: 'Sagnik',
    pin: 'Sagnik',
    email: 'sagnik.datta.aeie27@heritageit.edu.in',
    emeregency:['sagnik.datta2020@gmail.com']
  },
  {
    id: 'Anusha',
    pin: 'Anusha',
    email: 'anusha.pal.aeie27@heritageit.edu.in',
    emergency:['palanusha82@gmail.com']
  }
];

app.post('/login/:userId/:pin', (req, res) => {
  const { userId, pin } = req.params;

  let flag = 0;

  for (let i = 0; i < users.length; i++) {
    if (users[i].id === userId && users[i].pin === pin) {
      flag = 1;
      break;
    }
  }

  if (flag === 0) {
    res.status(500).json({ message: 'User not found' });
  } else {
    res.status(200).json({ message: 'User authenticated successfully' });
  }
});

app.post('/register/:userId/:password/:email/:contact1/:contact2/:contact3', (req, res) => {
  const { userId, password, email, contact1, contact2, contact3 } = req.params;
  
  
  if (!userId.trim() || !password.trim() || !email.trim()) {
      return res.status(400).json({ error: 'Missing required fields' });
  }

  
  const newUser = {
      id: userId,
      pin: password,
      email: email
  };

  
  const emergencyContacts = [];

  
  if (contact1.trim()) {
      emergencyContacts.push(contact1);
  }
  if (contact2.trim()) {
      emergencyContacts.push(contact2);
  }
  if (contact3.trim()) {
      emergencyContacts.push(contact3);
  }

  
  newUser.emergency = emergencyContacts;

  
  users.push(newUser);

  
  console.log(newUser);
  return res.status(200).json(users);
});


app.post('/update-location/:userId/:latitude/:longitude/:timestamp', (req, res) => {
  const { userId, latitude, longitude, timestamp } = req.params;

  console.log('Received location update:', userId, latitude, longitude, timestamp);

  if (!userId || !latitude || !longitude || !timestamp) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  userLocations[userId] = {
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    timestamp
  };

  console.log(`User ${userId} location updated:`, userLocations[userId]);
  console.log(userLocations);
  res.status(200).json({ message: 'Location updated successfully' });
});

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

app.post('/panic/:userId/:latitude/:longitude/:timestamp', async (req, res) => {
  const { userId, latitude, longitude, timestamp } = req.params;

  console.log('Received Panic Attack:', userId, latitude, longitude, timestamp);

  if (!userId || !latitude || !longitude || !timestamp) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const userx = users.find(u => u.id === userId);
  if (!userx) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const emeregency = userx.emergency;

  userLocations[userId] = {
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    timestamp
  };

  console.log(userLocations);

  panic[userId] = { count: 0, timestamp };

  const locationsCopy = { ...userLocations };
  const currentTime = new Date(timestamp).getTime();
  const locationsArray = Object.entries(locationsCopy).map(([key, value]) => {
    const distance = calculateDistance(
      parseFloat(latitude),
      parseFloat(longitude),
      value.latitude,
      value.longitude
    );
    const timeDifference = Math.abs(currentTime - new Date(value.timestamp).getTime());
    return {
      userId: key,
      ...value,
      distance: distance,
      timeDifference: timeDifference
    };
  });

  const maxDistance = Math.max(...locationsArray.map(loc => loc.distance));
  const maxTimeDifference = Math.max(...locationsArray.map(loc => loc.timeDifference));

  locationsArray.forEach(loc => {
    loc.normalizedDistance = loc.distance / maxDistance;
    loc.normalizedTimeDifference = loc.timeDifference / maxTimeDifference;
    loc.combinedScore = loc.normalizedDistance + loc.normalizedTimeDifference;
  });

  // Sort the array by the combined score
  locationsArray.sort((a, b) => a.combinedScore - b.combinedScore);

  console.log(locationsArray);
  console.log(panic);
  const lat = userLocations[userId].latitude;
  const long = userLocations[userId].longitude;

  // Send emails asynchronously
  const emailPromises = locationsArray.map(loc => {
    const user = loc.userId;
    const userIndex = users.findIndex(u => u.id === user);

    if (userIndex !== -1) {
      const contact = users[userIndex].email;

      const mailOptions = {
        from: 'jibiteshheva@gmail.com',
        to: [contact,...emeregency],
        subject: 'HELP ALERT',
        text: `${userId} needs your help \n To confirm : http://localhost:3000/request/${userId} \n Location : https://www.google.com/maps?q=${lat},${long}`
      };

      return transporter.sendMail(mailOptions);
    }
    console.log(mailOptions);
    return Promise.resolve(); // Return a resolved promise if user not found
  });

  try {
    await Promise.all(emailPromises);
    console.log('All emails sent successfully');
    res.status(200).json({ message: 'Panic Attack sent successfully' });
  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).json({ message: 'Error sending emails' });
  }
});

app.get('/request/:userId', (req, res) => {
  const { userId } = req.params;

  if (panic[userId].count === 3) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Request for ${userId}</title>
        </head>
        <body>
          <h1>Thank you for the initiative</h1>
          <p>${userId} has already received help</p>
        </body>
      </html>
    `;

    res.send(htmlContent);
  } else {
    panic[userId].count = panic[userId].count + 1;
    const lat = userLocations[userId].latitude;
    const long = userLocations[userId].longitude;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Request for ${userId}</title>
        </head>
        <body>
          <h1>Thank you for the initiative</h1>
          <p>${userId} needs help</p>
          <a href='https://www.google.com/maps?q=${lat},${long}'>Location</a>
        </body>
      </html>
    `;

    res.send(htmlContent);
  }
});

app.post('/alert/:userId/:latitude/:longitude/:timestamp', async (req, res) => {
  const { userId, latitude, longitude, timestamp } = req.params;

  console.log('Received Alert Notification:', userId, latitude, longitude, timestamp);

  if (!userId || !latitude || !longitude || !timestamp) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  userLocations[userId] = {
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    timestamp
  };

  console.log(userLocations);

  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const contact = user.emergency;
  const lat = userLocations[userId].latitude;
  const long = userLocations[userId].longitude;

  const mailOptions = {
    from: 'jibiteshheva@gmail.com',
    to: contact,
    subject: 'HELP ALERT',
    text: `${userId} needs your help https://www.google.com/maps?q=${lat},${long}`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(5000, () => {
  console.log('Server is running on port 3000');
});
