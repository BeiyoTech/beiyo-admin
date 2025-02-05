// routes/hostelRoutes.js
const express = require('express');
const router = express.Router();
const Hostel = require('../models/Hostel');
const Room = require('../models/Room');
const Resident = require('../models/newMemberResident');
const Payment = require('../models/Payment');
const moment = require('moment');
const Ticket = require('../models/ticket');

router.get('/dataMetrics',async(req,res)=>{
    const resident = await Resident.find({living:"current"});
    const booking = await Resident.find({living:"new"});
    const oldResident = await Resident.find({living:"old"});
    const hostels = await Hostel.find();
    const rooms = await Room.find();
    const totalTickets = await Ticket.find();
    const openTickets = await Ticket.find({status:"Open"});
    const closeTickets = await Ticket.find({status:"Closed"});
    const inProgressTickets = await Ticket.find({status:"In Progress"})
    let noOfBeds = 0;

    for(const hostel of hostels){
        noOfBeds += hostel.totalBeds
    }
    const metrics={
        noOfBeds:noOfBeds,
        noOfResidents:resident.length,
        noOfBookings:booking.length,
        noOfHostels:hostels.length,
        noOfRooms:rooms.length,
        totalTickets:totalTickets.length,
        openTickets:openTickets.length,
        closeTickets:closeTickets.length,
        inProgressTickets:inProgressTickets.length,
        oldResident:oldResident.length
    }

    res.json(metrics);

})

module.exports = router;
