// Resident model (resident.js)
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const residentSchema = new mongoose.Schema({
  name: { type: String,
    //  required: true
     },
  email: { type: String, 
    // required: true, 
    unique: true },
  mobileNumber: { type: Number, 
    // required: true 
  },
  address: { type: String,
    //  required: true 
    },
  parentsName: { type: String, 
    // required: true 
  },
  parentsMobileNo: { type: Number, 
    // required: true 
  },
  hostel: { type: String, required: true },
  roomNumber: { type: String, required: true },
  dateJoined:{type:Date},
  password: { type: String, },
  documentId:{type:String},
  imageUrl:{type:String},
  aadhaarCardUrl: {type:String},
  // signedDocuments:String,
  // intitutionDetails:String,
  payments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }],
  contractEndDate: { type: Date },
  contractTerm:{type:Number,required:true},
  rent:{type:Number},
  deposit:{type:Number},
  roomNumberId:{type : mongoose.Schema.Types.ObjectId, ref:'Room', required:true},
  amount:{type:String},
  contract:{type:Date},
  hostelId:{type : mongoose.Schema.Types.ObjectId,ref:'Hostel'},
  living:{type:String,default:'current',enum:['current','old','new']},
  maintenanceCharge:{type:Number},
  formFee:{type:Number},
  dueAmount:{type:Number,default:0},
  dueChargePayment:{type:mongoose.Schema.Types.ObjectId,ref:'Payment'},
  depositStatus:{type:Boolean},
  maintenanceChargeStatus:{type:Boolean},
  formFeeStatus:{type:Boolean},
  extraDays:{type:Number},
  extraDayPaymentAmount:{type:Number},
  extraDayPaymentAmountStatus:{type:Boolean,default:false},
  gender:{type:String,enum:['male','female','others']},
  beiyoCredits:{type:Number,default:0},
  subscriptionPlan:{
    type: mongoose.Schema.Types.ObjectId,
  },
  deductions: [
    {
      amount: {type:Number},
      reason: {type:String},
      date: {type:Date}
    }
  ]

  // other fields
});
residentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
module.exports = mongoose.model('Resident', residentSchema);
