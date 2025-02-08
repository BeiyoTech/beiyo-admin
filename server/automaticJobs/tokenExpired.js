const Resident = require("../models/newMemberResident");

const checkExpiredBookings = async () => {
  try {
    const now = new Date();
    const expirationTime = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 48 hours ago

    // Find expired bookings using createdAt timestamp
    const expiredBookings = await Resident.find({
      living: "new",
      createdAt: { $lte: expirationTime },
    });

    for (let booking of expiredBookings) {
      // Update status to expired
      await Resident.findByIdAndUpdate(booking._id, { living: "expired" });
        await Rooms.updateOne({ _id: booking.roomNumberId }, { $pull: { residents:
          booking._id },$inc: { remainingCapacity: 1 } });
        await Hostel.updateOne({_id:booking.hostelId},{
          $pull:{residents:booking._id}
        })  

        await totalTenants(booking.hostelId);
        await totalRemainingBeds(booking.hostelId);
    //   console.log(`Booking ID ${booking._id} has expired.`);
    }
  } catch (error) {
    console.error("Error checking expired bookings:", error);
  }
};

// Run this function every 10 minutes
setInterval(checkExpiredBookings, 10 * 60 * 1000);
