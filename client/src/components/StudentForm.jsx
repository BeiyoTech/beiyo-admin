import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Button, TextField, Typography, Select, MenuItem, InputLabel, FormControl, CssBaseline, Grid } from '@mui/material';
import dayjs from 'dayjs';
import useFetchHostels from '../hooks/useFetchHostels';

const StudentForm = () => {
  // const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);
  // const [price,setPrice] = useState(null);
  
  // const [hostel,setHostel]= useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    address: '',
    parentsName: '',
    parentsMobileNo: '',
    hostel: '',
    roomNumber: '',
    dateJoined: dayjs().format('YYYY-MM-DD'),
    contract:dayjs().format('YYYY-MM-DD'),
     password: '',
    confirmPassword: '',
    amount:''
  });
  const [errors, setErrors] = useState({});

  // useEffect(() => {
  //   const fetchHostels = async () => {
  //     try {
  //       const response = await axios.get('https://beiyo-admin.vercel.app/api/hostels');
  //       setHostels(response.data);
  //     } catch (error) {
  //       console.error('Error fetching hostels:', error);
  //     }
  //   };
  //   fetchHostels();
  // }, []);

  const hostels = useFetchHostels(); 


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleHostelChange = async (event) => {
    const { value } = event.target;
    setFormData({
      ...formData,
      hostel: value,
      roomNumber: '', // Clear room number when hostel changes
    });
    const response = await axios.get('https://beiyo-admin.vercel.app/api/rooms');
          
          const allRooms = response.data;
          const selectedHostel = hostels.find(hostel=>hostel.name===value)
          const filteredRooms = allRooms.filter(room => room.hostelId === selectedHostel._id);
          console.log(filteredRooms)
          setRooms(filteredRooms);
    // Fetch rooms for the selected hostel

  };

  const handleRoomChange = (event) => {
    const { value } = event.target;
    setFormData({
      ...formData,
      roomNumber: value,
    });
    // Get the selected room's price
    const selectedRoom = rooms.find(room => room.roomNumber === value);
    setPrice(selectedRoom ? selectedRoom.price : 0); // Set the room price
  };

  const validateForm = () => {
    let tempErrors = {};
    if (!formData.name) tempErrors.name = "Name is required";
    if (!formData.email) tempErrors.email = "Email is required";
    if (!formData.mobileNumber || !/^\d{10}$/.test(formData.mobileNumber)) {
      tempErrors.mobileNumber = "Mobile number must be 10 digits";
    }
    if (!formData.address) tempErrors.address = "Address is required";
    if (!formData.parentsName) tempErrors.parentsName = "Parents' name is required";
    if (!formData.parentsMobileNo || !/^\d{10}$/.test(formData.parentsMobileNo)) {
      tempErrors.parentsMobileNo = "Parents' mobile number must be 10 digits";
    }
    if (!formData.hostel) tempErrors.hostel = "Hostel selection is required";
    if (!formData.roomNumber) tempErrors.roomNumber = "Room number is required";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };
    
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (validateForm()) {
        await axios.post('https://beiyo-admin.vercel.app/api/newResident', formData);
      setFormData({
        name: '',
        email: '',
        mobileNumber: '',
        address: '',
        parentsName: '',
        parentsMobileNo: '',
        hostel: '',
        roomNumber: '',
        dateJoined: dayjs().format('YYYY-MM-DD'),
        contract:dayjs().format('YYYY-MM-DD'),
         password: '',
        confirmPassword: '',
        amount:'',
      })
    }
  };

  return (
   <div className='paymentform'>
     <Box sx={{ flexGrow: 1, p: 3, backgroundColor: '#', minHeight: '80vh', border:2,borderRadius:2}} >
      <CssBaseline />
      <Typography variant="h4" gutterBottom>
        Resident Registration Form
      </Typography>
      <form onSubmit={handleSubmit} noValidate style={{width:'100%'}}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Mobile Number"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleChange}
              error={!!errors.mobileNumber}
              helperText={errors.mobileNumber}
              inputProps={{ maxLength: 10 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              error={!!errors.address}
              helperText={errors.address}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Parents' Name"
              name="parentsName"
              value={formData.parentsName}
              onChange={handleChange}
              error={!!errors.parentsName}
              helperText={errors.parentsName}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Parents' Mobile Number"
              name="parentsMobileNo"
              value={formData.parentsMobileNo}
              onChange={handleChange}
              error={!!errors.parentsMobileNo}
              helperText={errors.parentsMobileNo}
              inputProps={{ maxLength: 10 }}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth error={!!errors.hostel}>
              <InputLabel>Hostel</InputLabel>
              <Select
                name="hostel"
                value={formData.hostel}
                onChange={handleHostelChange}
                
              >
                {hostels.map(hostel => (
                  <MenuItem key={hostel._id} value={hostel.name} >
                    {hostel.name}
                   
                  </MenuItem>
                ))}
              </Select>
              {errors.hostel && <Typography color="error">{errors.hostel}</Typography>}
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth error={!!errors.roomNumber}>
              <InputLabel>Room Number</InputLabel>
              <Select
                name="roomNumber"
                value={formData.roomNumber}
                onChange={handleRoomChange}
                disabled={!formData.hostel}
              >
                {rooms.map(room => (
                  <MenuItem key={room._id} value={room.roomNumber} >
                    {room.roomNumber}
                    {/* {setPrice(room.price)} */}
                  </MenuItem>
                ))}
              </Select>
              {errors.roomNumber && <Typography color="error">{errors.roomNumber}</Typography>}
            </FormControl>
            <TextField
              fullWidth
              label="Amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange} 
            />
            <TextField
          label="Date Joined"
          name="dateJoined"
          type="date"
          value={formData.dateJoined}
          onChange={handleChange}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
         <TextField
          label="Contract end"
          name="contract"
          type="date"
          value={formData.contract}
          onChange={handleChange}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
         <TextField
        label="Password"
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        required
        fullWidth
        margin="normal"
      />
      <TextField
        label="Confirm Password"
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
        onChange={handleChange}
        required
        fullWidth
        margin="normal"
      />
          </Grid>
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
            >
              Submit & Pay
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
   </div>
  );
};

export default StudentForm;