// Backend (Node.js/Express)
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const moment = require('moment');
const Resident = require('../models/newMemberResident'); // Your Resident model
const dayjs = require('dayjs');
const Payment = require('../models/Payment');
const Hostels = require('../models/Hostel');
const Rooms = require('../models/Room');
const totalTenants = require('../functions/TotalTenats');
const uuid = require('uuid');
const Hostel = require('../models/Hostel');
const totalRemainingBeds = require('../functions/totalRemainingBeds');
const mappingResident = require('../functions/MappingResident');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { uploadToS3 } = require('../config/aws');





router.post('/websiteBooking',async(req,res)=>{
  try {
    const {name, email, mobileNumber,hostelId,roomNumberId,dateJoined,rent,deposit,depositStatus,maintainaceCharge,maintainaceChargeStatus,formFee,formFeeStatus,contractTerm,extraDayPaymentAmount,extraDayPaymentAmountStatus,extraDays,gender} = req.body;
    const formattedDate = dateJoined ? dayjs(dateJoined).format('YYYY-MM-DD') : null;
    const contractEndDate = moment(formattedDate).add(contractTerm, 'months').format('YYYY-MM-DD');
    const Hostel = await Hostels.findById(hostelId);
    const Room = await Rooms.findById(roomNumberId);
    const hostelName = Hostel.name;
    const roomNumber  = Room.roomNumber;
    let dueAmount = 0;
    let livingStatus = "current";
    if(!depositStatus){
      dueAmount += Number(deposit);
    }
    if(!maintainaceChargeStatus){
      dueAmount += Number(maintainaceCharge);
    }
    if(!formFeeStatus){
      dueAmount += Number(formFee);
    }
    if(!extraDayPaymentAmountStatus){
      dueAmount += Number(extraDayPaymentAmount);
    }

    if(!depositStatus&&!extraDayPaymentAmountStatus&&!maintainaceChargeStatus){
       livingStatus = "new"
    }

     const newResident = new Resident({
      name, email, mobileNumber, 
       hostelId,   
      roomNumberId:roomNumberId,
      hostel: hostelName,
      roomNumber: roomNumber,
      dateJoined: formattedDate,
      contractEndDate,
      contractTerm,
      rent:rent,
      deposit:deposit,
      maintainaceCharge:maintainaceCharge,
      formFee:formFee,
      dueAmount:dueAmount,
      extraDayPaymentAmount:extraDayPaymentAmount,
      extraDayPaymentAmountStatus:extraDayPaymentAmountStatus,
      depositStatus:depositStatus,
      maintainaceChargeStatus:maintainaceChargeStatus,
      formFeeStatus:formFeeStatus,
      extraDays,
      gender,
      living:livingStatus,
      payments:[],
      password:mobileNumber,
    });
    await newResident.save();
      const resident = await Resident.findOne({ email });      
      if(Room.remainingCapacity>0){
        Room.remainingCapacity--;
         Room.residents.push(newResident._id);
        await Room.save();
      }else{
        return res.status(400).json({message:"Room is full"});
      }
      if(Hostel.totalRemainingBeds>0){
        Hostel.totalRemainingBeds--;
        Hostel.residents.push(newResident._id);
        await Hostel.save();
      }else{
        return res.status(400).json({message:"Hostel Room is full"});
      }

      await totalTenants(hostelId);
      await totalRemainingBeds(hostelId);
      
    
        await generateDueCharge(newResident._id);
     
  let updatedResident= newResident;


      if(depositStatus||extraDayPaymentAmountStatus){
     const paymentUpdatedResident = await generateMonthlyPayments(newResident._id, newResident.contractEndDate);
    updatedResident=paymentUpdatedResident
    }
    const token = jwt.sign({ userId: newResident._id }, process.env.JWT_SECRET , { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
    res.status(201).json({updatedResident,token});

  } catch (error) {
    res.json(error)
    console.log(error);
  }
})



const upload = multer({ 
  storage: multer.memoryStorage(),
  // optional file filter
  fileFilter: (req, file, cb) => {
    console.log('Received file:', file);
    cb(null, true);
  }
});





router.post('/', upload.fields([
  { name: 'aadhaarCard', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]), async (req, res) => {
    try {
        // Extract data from the form
        const { name, email, mobileNumber, address, parentsName, parentsMobileNo, hostelId, roomNumberId, dateJoined, password, rent, deposit, contractTerm, maintenanceCharge, formFee, extraDayPaymentAmount, extraDayPaymentAmountStatus, maintenanceChargeStatus, depositStatus, formFeeStatus, extraDays } = req.body;
        
        // Format the date
        const formattedDate = dateJoined ? dayjs(dateJoined).format('YYYY-MM-DD') : null;
        const contractEndDate = moment(formattedDate).add(contractTerm, 'months').format('YYYY-MM-DD');
        
        // Find Hostel and Room by their IDs
        const hostel = await Hostel.findById(hostelId);
        if (!hostel) {
            return res.status(400).json({ message: "Hostel not found" });
        }
        const room = await Rooms.findById(roomNumberId);
        if (!room) {
            return res.status(400).json({ message: "Room not found" });
        }
        
        const hostelName = hostel.name;
        const roomNumber = room.roomNumber;
        
        let dueAmount = 0;
        let livingStatus = "current";
        
        // Calculate dueAmount based on statuses
        if (!depositStatus) dueAmount += Number(deposit);
        if (!maintenanceChargeStatus) dueAmount += Number(maintenanceCharge);
        if (!formFeeStatus) dueAmount += Number(formFee);
        if (!extraDayPaymentAmountStatus) dueAmount += Number(extraDayPaymentAmount);
        console.log(dueAmount)
        // Set living status to "new" if no payments are pending
        if (!depositStatus && !extraDayPaymentAmountStatus && !maintainaceChargeStatus) {
            livingStatus = "new";
        }

        // Check if files are uploaded
        if (!req.files || !req.files.aadhaarCard || !req.files.image) {
          return res.status(400).json({ message: "Aadhaar card or image file is missing" });
        }

        // Upload files to S3
        const [aadhaarCardUrl, imageUrl] = await Promise.all([
            uploadToS3(req.files.aadhaarCard[0], 'residentAadhaarCards'),
            uploadToS3(req.files.image[0], 'residentImages')
        ]);

        // Create new resident in the database
        const newResident = new Resident({
            name,
            email,
            mobileNumber,
            address,
            parentsName,
            parentsMobileNo,
            hostelId,
            password,
            roomNumberId,
            hostel: hostelName,
            roomNumber,
            dateJoined: formattedDate,
            contractEndDate,
            contractTerm,
            rent,
            deposit,
            aadhaarCardUrl,
            imageUrl,
            maintenanceCharge,
            formFee,
            dueAmount:dueAmount,
            extraDayPaymentAmountStatus,
            depositStatus,
            formFeeStatus,
            living: livingStatus,
            extraDayPaymentAmount,
            maintenanceChargeStatus,
            extraDays
        });

        await newResident.save();

        const resident = await Resident.findOne({ email });

        // Check if room capacity is available
        if (room.remainingCapacity > 0) {
            room.remainingCapacity--;
            room.residents.push(resident._id);
            await room.save();
        } else {
            return res.status(400).json({ message: "Room is full" });
        }

        // Check if hostel has remaining beds
        if (hostel.totalRemainingBeds > 0) {
            hostel.totalRemainingBeds--;
            hostel.residents.push(resident._id);
            await hostel.save();
        } else {
            return res.status(400).json({ message: "Hostel Room is full" });
        }

        // Update total tenants and remaining beds
        await totalTenants(hostelId);
        await totalRemainingBeds(hostelId);

        // Generate due charge for the resident
        await generateDueCharge(resident._id);

        // Update payments if deposit or extra day payment exists
        if (depositStatus || extraDayPaymentAmountStatus) {
            const paymentUpdatedResident = await generateMonthlyPayments(newResident._id, newResident.contractEndDate);
        }

        // Send response
        res.status(201).json(newResident);
    } catch (error) {
        console.error('Error creating resident', error);
        res.status(500).send('Error creating resident or processing payment: ' + error.message);
    }
});



 router.get('/', async (req, res) => {
    try {
      const newResidents = await Resident.find();
      // updateResidentHostelIds();
      // amountToRent();
      // mappingResident();
      res.json(newResidents);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });


// geting  all residents through ids
router.get('/allResidentIds', async (req, res) => {
  try {
    // Get the list of resident IDs from the query parameter (assuming they are comma-separated)
    const residentIds = req.query.ids.split(',');

    // Find residents in the database whose IDs match the provided list
    const residents = await Resident.find({
      _id: { $in: residentIds }
    });

    // Return the list of residents
    res.status(200).json(residents);
  } catch (error) {
    console.error('Error fetching residents:', error);
    res.status(500).json({ error: 'Failed to fetch residents' });
  }
});


router.delete('/permanentDeleteResident/:id',async(req,res)=>{
  try {
    const residentId = req.params.id;
    const resident = await Resident.findById(residentId);
    if (!resident) {
      return res.status(404).json({ message: "Resident not found" });
      }
      // if(resident.living==='old'){
      //   return res.status(200).json({ message: "Resident already left the beiyo" });
      // }
      await Rooms.updateOne({ _id: resident.roomNumberId }, { $pull: { residents:
        resident._id },$inc: { remainingCapacity: 1 } });
      await Hostel.updateOne({_id:resident.hostelId},{
        $pull:{residents:resident._id}
      })  

      await totalTenants(resident.hostelId);
      await totalRemainingBeds(resident.hostelId);
       await resident.deleteOne();
      res.status(200).json('Permanently Resident Left the Beiyo')
  } catch (error) {
    res.status(400).json(error);
  }
})


  // delting resident
  router.delete('/deleteResident/:id',async(req,res)=>{
    try { 
      const residentId = req.params.id;
      const resident = await Resident.findById(residentId);
      if (!resident) {
        return res.status(404).json({ message: "Resident not found" });
        }
        if(resident.living==='old'){
          return res.status(200).json({ message: "Resident already left the beiyo" });
        }
        await Rooms.updateOne({ _id: resident.roomNumberId }, { $pull: { residents:
          resident._id },$inc: { remainingCapacity: 1 } });
        await Hostel.updateOne({_id:resident.hostelId},{
          $pull:{residents:resident._id}
        })  

        await totalTenants(resident.hostelId);
        await totalRemainingBeds(resident.hostelId);
        resident.living='old'
        await resident.save();
        res.status(200).json('Resident Left the Beiyo')
    } catch (error) {
      res.json(error)
      console.log(error);
    }
  })

// update Put resident
// PUT API to update resident data
router.put('/:id', async (req, res) => {
  try {
    const residentId = req.params.id;
    
    // Extract the data to update from the request body
    const updateData = req.body;

    const resident = await Resident.findById(residentId);
    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    if (updateData.rent && updateData.rent !== resident.rent) {
      const newAmount = updateData.rent;

      // Update the resident's payments array
      await Payment.updateMany(
        { userId: residentId },
        { $set: { amount: newAmount ,rent:newAmount} },
        { new: true }
      );
    }

    // Find the resident by ID and update it with the provided data
    const updatedResident = await Resident.findByIdAndUpdate(
      residentId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedResident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    res.status(200).json({
      message: 'Resident updated successfully',
      data: updatedResident,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating resident', error: error.message });
  }
});


  router.get('/hostel/:id',async(req,res)=>{
    try {
      const newResidents = await Resident.find({hostelId:req.params.id});
      res.json(newResidents);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  })
  router.get('/:id', async (req, res) => {
    try {
      const residentId = req.params.id
      const resident = await Resident.findById(residentId);
      if (!resident) {
        return res.status(404).json({ message: 'Resident not found' });
      }
      
      // console.log(`Generating payments for resident: ${resident._id}, contract end date: ${resident.contract}`);
      
      res.json(resident);
    } catch (error) {
      console.error('Error fetching resident or generating payments:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
router.post('/amount',async(req,res)=>{
  try {
    const email = req.body.email;
    const amount = req.body.amount;
    const contract = req.body.contract
    const resident = await Resident.findOneAndUpdate( 
       {  email },
      {  amount,contract: new Date() },
      { new: true }
    );
    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }
    resident.amount = amount;
    resident.contract=contract;
    await resident.save();

  } catch (error) {
    console.log(error);
  }
})

router.get('/resident/contractEnd', async (req, res) => {
  try {
    // Get the current month in the format 'YYYY-MM'
    const currentMonth = moment().format('YYYY-MM');
  
    // Find residents who are currently living and populate their payments
    const residents = await Resident.find({ "living": "current" }).populate('payments');
  
    // Filter residents whose last payment's month is before the current month
    const contractEndedResidents = residents.filter(resident => {
      const lastPayment = resident.payments[resident.payments.length - 1];
      
      // Ensure there is a last payment and the payment month is stored in 'YYYY-MM' format
      if (lastPayment && lastPayment.month) {
        // Compare the saved payment month with the current month
        return moment(lastPayment.month, 'YYYY-MM').isBefore(currentMonth, 'month');
      }
  
      return false; // Exclude residents with no payments or payments within the current or future months
    });
  
    // Respond with the filtered list of residents
    res.status(200).json(contractEndedResidents);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  } 
});

router.get('/resident/export-contract-ended-residents', async (req, res) => {
  try {
    // Get the current month in the format 'YYYY-MM'
    const nextMonth = moment().add(1, 'month').format('YYYY-MM');

    // Find residents who are currently living and include their payments
    const residents = await Resident.find({ living: 'current' }).populate('payments');

    // Filter residents whose last payment's month is before the current month
    const contractEndedResidents = residents.filter((resident) => {
      const lastPayment = resident.payments[resident.payments.length - 1];
      if (lastPayment && lastPayment.month) {
        return moment(lastPayment.month, 'YYYY-MM').isBefore(nextMonth, 'month');
      }
      return false;
    });

    // Prepare data for Excel
    const data = contractEndedResidents.map((resident) => ({
      id: resident.id,
      Name: resident.name,
      Email: resident.email,
      Hostel: resident.hostel, // Assuming 'hostel' is a string field
      RoomNumber: resident.roomNumber, // Assuming 'roomNumber' is a number or string
      LastPaymentMonth: resident.payments[resident.payments.length - 1].month,
    }));

    // Create a new workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contract Ended Residents');

    // Write the workbook to a buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers for file download
    res.setHeader('Content-Disposition', 'attachment; filename="ContractEndedResidents.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // Send the Excel file
    res.send(excelBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/extendContract/:residentId',async(req,res)=>{
  try {
    const extendedMonth = req.body.extendedMonth;
    const formattedDate = moment().format('YYYY-MM-DD');
    const contractEndDate = moment(formattedDate).add(extendedMonth, 'months').format('YYYY-MM-DD');
    const oldResident = await Resident.findById(req.params.residentId);
    const newContractTerm = oldResident.contractTerm+extendedMonth

    const resident = await Resident.findByIdAndUpdate(req.params.residentId, { 
      contractEndDate,contractTerm:newContractTerm
    }, { new: true})
    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }
    await generateMonthlyPayments(resident._id, contractEndDate);
    res.status(200).json(resident);
  } catch (error) {
    console.log(error);
  }
})


router.get('/due/dueAmountResident', async (req, res) => {
  try {
    const residents = await Resident.find({ dueAmount: { $gt: 0 },hostel:"Arcadia"})
      .select('name roomNumber dueAmount hostel'); // Select only the required fields

    // Convert the resident data to an array of objects (for Excel format)
    const residentData = residents.map(resident => ({
      Name: resident.name,
      Hostel: resident.hostel,
      RoomNumber: resident.roomNumber,
      DueAmount: resident.dueAmount
    }));

    // Create a new workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(residentData);

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, `${residents.hostel} Residents` );

    // Generate the Excel file and save it temporarily
    const filePath = path.join(__dirname, 'dueAmountResident.xlsx');
    XLSX.writeFile(workbook, filePath);

    // Set the response headers to download the file
    res.setHeader('Content-Disposition', 'attachment; filename=dueAmountResident.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // Send the file as a response
    res.download(filePath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({ error: 'Error downloading the file' });
      }

      // Optionally delete the file after sending
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting file:', unlinkErr);
      });
    });
  } catch (error) {
    console.error("Error fetching residents:", error); // Log detailed error
    res.status(500).json({ error: error.message });
  }
});
// living current
router.get('/mobile/number',async(req,res)=>{
  try {
    const residents = await Resident.find({living:"current"})
      .select('name roomNumber mobileNumber hostel'); // Select only the required fields

    // Convert the resident data to an array of objects (for Excel format)
    const residentData = residents.map(resident => ({
      Name: resident.name,
      Hostel: resident.hostel,
     MobileNumber: resident.mobileNumber,
    }));

    // Create a new workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(residentData);

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, `${residents.hostel} Residents` );

    // Generate the Excel file and save it temporarily
    const filePath = path.join(__dirname, 'dueAmountResident.xlsx');
    XLSX.writeFile(workbook, filePath);

    // Set the response headers to download the file
    res.setHeader('Content-Disposition', 'attachment; filename=dueAmountResident.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // Send the file as a response
    res.download(filePath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({ error: 'Error downloading the file' });
      }

      // Optionally delete the file after sending
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting file:', unlinkErr);
      });
    });
  }catch (error) {
    res.status(500).json(error.message);
  }
})


// Deduct deposit route
router.post('/deduct-deposit/:id', async (req, res) => {
  const { id } = req.params; // Resident ID from URL params
  const { amount, reason } = req.body; // Deduction details

  try {
    // Find the resident by ID
    const resident = await Resident.findById(id);

    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    // Check if the deduction amount is greater than the current deposit
    if (amount > resident.deposit) {
      return res.status(400).json({ message: 'Insufficient deposit' });
    }

    // Deduct the deposit
    resident.deposit -= amount;

    // Add the deduction record to the deductions array
    resident.deductions.push({ amount, reason, date: new Date() });

    // Save the updated resident data
    await resident.save();

    return res.status(200).json({
      message: 'Deduction processed',
      remainingDeposit: resident.deposit,
      deductions: resident.deductions
    });
  } catch (error) {
    console.error('Error deducting deposit:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});
  

    // Payment successful, save user data
    module.exports = router;


    // functions

  // generate monthly payment
    async function generateMonthlyPayments(userId, contractEndDate) {
      try {
        const resident = await Resident.findById(userId);
        const startDate = dayjs(resident.dateJoined).startOf('day');
        let currentDate;
    
        // Check if the resident joined on the 1st of the month
        if (startDate.date() === 1) {
          currentDate = startDate.startOf('month'); // Start from this month
        } else {
          currentDate = startDate.add(1, 'month').startOf('month'); // Start from the next month
        }
    
        // Generate payments based on the contract term
        for (let i = 0; i < resident.contractTerm; i++) {
          const month = currentDate.format('YYYY-MM');
          const existingPayment = await Payment.findOne({ userId, month });
    
          if (!existingPayment) {
            const payment = new Payment({
              userId,
              userName: resident.name,
              rent: resident.rent,
              amount: resident.rent,
              month,
              date: currentDate.toDate(),
              status: 'due',
              type: 'rent',
            });
    
            await payment.save();
            resident.payments.push(payment._id);
          }
    
          currentDate = currentDate.add(1, 'month');
        }
    
        // Save the resident with updated payments
        await resident.save();
    
        // Update the resident's contract term based on the number of payments generated
      const paymentUpdatedResident =  await Resident.findByIdAndUpdate(userId, {
          contractTerm: resident.payments.length,
        }, { new: true });
    return paymentUpdatedResident;
      } catch (error) {
        console.log(error);
      }
    };
 
    // generate due payment 
    async function generateDueCharge (userId){
      try {
        
        const resident = await Resident.findById(userId);
        const startDate = dayjs(resident.dateJoined).startOf('month');
          const month = startDate.format('YYYY-MM');
          const existingPayment = await Payment.findOne({ userId, month ,type:'dueCharge'});
          if(!existingPayment){
            const payment = new Payment({
              userId,
              userName:resident.name,
              amount: resident.dueAmount, // Replace with the appropriate amount
              month,
              date: startDate.toDate(),
              status: 'due',
              type:'dueCharge'
            });
      
            await payment.save();
            resident.dueChargePayment=payment._id;
            await resident.save();
          }
      } catch (error) {
        console.log(error);
      }
     }
    
    