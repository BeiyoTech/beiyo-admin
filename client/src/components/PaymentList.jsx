import React, { useState, useEffect } from 'react';

import {
  Box,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import api from '../../api/apiKey';

const PaymentList = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedHostel, setSelectedHostel] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const theme = useTheme();


  useEffect(() => {
    // Fetch hostels
    api.get('https://beiyo-admin.in/api/hostels')
      .then(response => setHostels(response.data))
      .catch(error => console.error('Error fetching hostels:', error));

    // Fetch months (this can be dynamic based on your needs)
    const currentYear = new Date().getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => `${currentYear}-${String(i + 1).padStart(2, '0')}`);
    setMonths(months);
  }, []);

  const handleFetchPayments = () => {
    setLoading(true);
    api.get(`https://beiyo-admin.in/api/dashboard/monthPayments/${selectedHostel}/${selectedMonth}`)
      .then(response => {
        setPayments(response.data);
        setFilteredPayments(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching payments:', error);
        setLoading(false);
      });
  };
  const filterPayments = (payments, status) => {
    if (status === 'all') {
      setFilteredPayments(payments);
    } else if (status === 'successful') {
      setFilteredPayments(payments.filter(payment => payment.status === 'successful'));
    } else if (status === 'due') {
      setFilteredPayments(payments.filter(payment => payment.status === 'due'));
    }
  };

  useEffect(() => {
    filterPayments(payments, selectedStatus);
  }, [selectedStatus, payments]);

  // Calculate total amount per hostel
  const calculateTotalPerHostel = () => {
    const totals = payments.reduce((acc, payment) => {
      if (!acc[payment.hostel]) {
        acc[payment.hostel] = 0;
      }
      acc[payment.hostel] += payment.amount;
      return acc;
    }, {});
    return totals;
  };

  const totalPerHostel = calculateTotalPerHostel();

  return (
   <div style={{minHeight:'100vh',}}>
     <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>Payment List</Typography>

      <Card  elevation={1} sx={{ mb: 4, p: 2 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="flex-end">
            <Grid item xs={12} sm={2} md={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Month</InputLabel>
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  label="Month"
                >
                  {months.map(month => (
                    <MenuItem key={month} value={month}>
                      {month}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Hostel</InputLabel>
                <Select
                  value={selectedHostel}
                  onChange={(e) => setSelectedHostel(e.target.value)}
                  label="Hostel"
                >
                  <MenuItem value="">All Hostels</MenuItem>
                  {hostels.map(hostel => (
                    <MenuItem key={hostel._id} value={hostel._id}>
                      {hostel.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  label="Payment Status"
                >
                  <MenuItem value="all">All Payments</MenuItem>
                  <MenuItem value="successful">Successful</MenuItem>
                  <MenuItem value="due">Due</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleFetchPayments} 
                fullWidth
                size="large"
              >
                Fetch Payments
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} elevation={3}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  {/* <TableCell align="right">Rent</TableCell> */}
                  <TableCell align="right">Additional Charge</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Cash</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
              {filteredPayments.map(payment => (
                  <TableRow key={payment._id} hover>
                    <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                    <TableCell>{payment.userName || 'N/A'}</TableCell>
                    <TableCell align="right">{payment.amount}</TableCell>
                    {/* <TableCell align="right">{payment.rent}</TableCell> */}
                     <TableCell align="right">{payment.additionalCharge}</TableCell>
                      <TableCell>{payment.status}</TableCell>
                      <TableCell>{payment.type}</TableCell>
                      <TableCell>{payment.cash?'Yes':'No'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>Total Amount Received per Hostel:</Typography>
            <Grid container spacing={2}>
              {Object.entries(totalPerHostel).map(([hostel, total]) => (
                <Grid item xs={12} sm={6} md={4} key={hostel}>
                  <Card elevation={2}>
                    <CardContent>
                      <Typography variant="subtitle1">{hostel}</Typography>
                      <Typography variant="h5" color="primary">{total}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </>
      )}
    </Box>
   </div>
  );
};

export default PaymentList;