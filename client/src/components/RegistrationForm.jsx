import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Checkbox, DatePicker, InputNumber, Upload, Select, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api/apiKey';
import "./styles/booking-form.css"
import "./styles/InvoicePreview.css"
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
const { Option } = Select;
import axios from "axios"

const ResidentForm = () => {
  const [form] = Form.useForm();
  const [dueAmount, setDueAmount] = useState(0);
  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [rent, setRent] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [extraDayPaymentAmount, setExtraDayPaymentAmount] = useState(0);
  const [extraDays, setExtraDays] = useState(0);
  const [load,setLoad]=useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
const [invoiceData, setInvoiceData] = useState(null);

  useEffect(() => {
    // Fetch hostels
    const fetchHostels = async () => {
      try {
        const response = await api.get('https://beiyo-admin.in/api/hostels');
        setHostels(response.data);
      } catch (error) {
        message.error('Error fetching hostels: ' + error.message);
      }
    };

    fetchHostels();
  }, []);

  const handleHostelChange = async (hostelId) => {
    try {
      const response = await api.get(`https://beiyo-admin.in/api/hostels/${hostelId}/remainingCapacityRooms`);
      setRooms(response.data);
      form.setFieldsValue({ roomNumberId: null }); // Reset room selection
    } catch (error) {
      message.error('Error fetching rooms: ' + error.message);
    }
  };

  const handleRoomSelect = (roomId) => {
    const room = rooms.find((r) => r._id === roomId);
    if (room) {
      setSelectedRoom(room.roomNumber);
      setRent(room.price);
      setDeposit(room.price);
      // Correct usage of setFieldsValue
      form.setFieldsValue({
        rent: room.price, 
        deposit: room.price,
      }); 
    }
  };
  

  const handleDateChange = (date) => {
    if (date && selectedRoom) {
      const room = rooms.find((r) => r.roomNumber === selectedRoom);
      if (room) {
        const oneDayRent = Math.ceil(room.price / 30);
        const selectedDate = date.startOf('day');
        const firstDayOfMonth = dayjs().startOf('month');

        // Check if the selected date is the 1st of the current month
        if (selectedDate.isSame(firstDayOfMonth)) {
          setExtraDayPaymentAmount(0);
          setExtraDays(0);
          form.setFieldsValue({
            extraDayPaymentAmount: 0,
          });
        } else {
          const nextMonth = date.startOf('month').add(1, 'month');
          const remainingDays = Math.ceil(nextMonth.diff(date, 'days'));
          const remainingDaysRent = oneDayRent * remainingDays;

          setExtraDayPaymentAmount(remainingDaysRent);
          setExtraDays(remainingDays);
          form.setFieldsValue({
            extraDayPaymentAmount: remainingDaysRent,
          });
        }
      }
    }
  };

  const handleFormSubmit = async (values) => {
    console.log('Form Values:', values);
    setLoad(true);
    
    setInvoiceData(values); // Store invoice data
    setShowInvoice(true); // Show invoice preview
    const formData = new FormData();
  
    Object.keys(values).forEach((key) => {
      if (key === 'aadhaarCard' || key === 'image') {
        const fileList = values[key];
        if (fileList && fileList.length > 0) {
          const file = fileList[0].originFileObj;
          formData.append(key, file);
        } else {
          console.error(`No file found for ${key}`);
        }
      } else {
        formData.append(key, values[key]);
      }
    });
  
    formData.append('extraDays', extraDays);
  
    try {
      const response = await api.post('https://beiyo-admin.in/api/newResident', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      message.success('Resident registered successfully!');
      setLoad(false);
      form.resetFields();
    } catch (error) {
      message.error('Error registering resident: ' + error.response?.data?.message || error.message);
      setLoad(false);
    }
  };
  
  const downloadPDF = () => {
    const invoiceElement = document.getElementById("invoice-preview");
    html2canvas(invoiceElement).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
      pdf.save(`Invoice_${invoiceData.mobileNumber}.pdf`);
    });
  };

  const sendInvoiceWhatsApp = async () => {
    const invoiceElement = document.getElementById("invoice-preview");
  
    html2canvas(invoiceElement).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
  
      // Convert PDF to Blob
      const pdfBlob = pdf.output("blob");
  
      // Create a downloadable URL for the PDF
      const pdfURL = URL.createObjectURL(pdfBlob);
  
      // Auto-download the PDF
      const a = document.createElement("a");
      a.href = pdfURL;
      a.download = `Invoice_${invoiceData.mobileNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  
      // Inform the user to attach the file manually
      const message = `Hello ${invoiceData.name}, your invoice is ready.`;
  
      // Open WhatsApp with Pre-filled Message
      const phoneNumber = invoiceData.mobileNumber;
      const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  
      setTimeout(() => {
        window.open(whatsappURL, "_blank");
      }, 2000); // Small delay to ensure PDF downloads before opening WhatsApp
    });
  };

  const calculateDueAmount = (values) => {
    const {
      deposit,
      maintainaceCharge,
      formFee,
      extraDayPaymentAmount,
      depositStatus,
      maintainaceChargeStatus,
      formFeeStatus,
      extraDayPaymentAmountStatus,
    } = values;
    let totalDue = 0;

    if (!depositStatus) totalDue += deposit || 0;
    if (!maintainaceChargeStatus) totalDue += maintainaceCharge || 0;
    if (!formFeeStatus) totalDue += formFee || 0;
    if (!extraDayPaymentAmountStatus) totalDue += extraDayPaymentAmount || 0;

    setDueAmount(totalDue);
  };

  return (
    <div className="form-div" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
      <Form
        form={form}
        layout="horizontal"
        onValuesChange={calculateDueAmount}
        onFinish={handleFormSubmit}
      >
        <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter the name' }]}>
          <Input placeholder="Enter name" />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
          <Input placeholder="Enter email" />
        </Form.Item>
        <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Please enter a valid password' }]}>
          <Input.Password placeholder="Enter password" />
        </Form.Item>
        <Form.Item name="mobileNumber" label="Mobile Number" rules={[{ required: true, message: 'Please enter the mobile number' }]}>
          <Input placeholder="Enter mobile number" />
        </Form.Item>
        <Form.Item name="address" label="Address">
          <Input.TextArea placeholder="Enter address" />
        </Form.Item>
        <Form.Item name="parentsName" label="Parent's Name">
          <Input placeholder="Enter parent's name" />
        </Form.Item>
        <Form.Item name="parentsMobileNo" label="Parent's Mobile Number">
          <Input placeholder="Enter parent's mobile number" />
        </Form.Item>

        <Form.Item name="hostelId" label="Select Hostel" rules={[{ required: true, message: 'Please select a hostel' }]}>
          <Select placeholder="Select a hostel" onChange={handleHostelChange}>
            {hostels.map((hostel) => (
              <Option key={hostel._id} value={hostel._id}>
                {hostel.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="roomNumberId" label="Select Room" rules={[{ required: true, message: 'Please select a room' }]}>
          <Select placeholder="Select a room" disabled={!rooms.length} onChange={handleRoomSelect}>
            {rooms.map((room) => (
              <Option key={room._id} value={room._id}>
                {room.roomNumber}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="dateJoined" label="Date Joined" rules={[{ required: true, message: 'Please select the joining date' }]}>
          <DatePicker style={{ width: '100%' }} onChange={handleDateChange} />
        </Form.Item>
        <Form.Item name="contractTerm" label="Contract Term (Months)">
          <InputNumber min={1} placeholder="Enter contract term" style={{ width: '100%' }} />
        </Form.Item>
       
        <Form.Item name="rent" label="Rent"> <InputNumber value={rent} readOnly style={{ width: '100%' }} /> </Form.Item>
        <Form.Item name="deposit" label="Deposit"> <InputNumber value={deposit} readOnly style={{ width: '100%' }} /> </Form.Item>
        <Form.Item name="maintainaceCharge" label="Maintenance Charge">
          <InputNumber min={0} placeholder="Enter maintenance charge" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="formFee" label="Form Fee">
          <InputNumber min={0} placeholder="Enter form fee" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="extraDayPaymentAmount" label="Extra Day Payment Amount"> <InputNumber value={extraDayPaymentAmount} readOnly style={{ width: '100%' }} /> </Form.Item>
        <Form.Item name="depositStatus" valuePropName="checked">
          <Checkbox>Deposit Paid</Checkbox>
        </Form.Item>
        <Form.Item name="maintainaceChargeStatus" valuePropName="checked">
          <Checkbox>Maintenance Charge Paid</Checkbox>
        </Form.Item>
        <Form.Item name="formFeeStatus" valuePropName="checked">
          <Checkbox>Form Fee Paid</Checkbox>
        </Form.Item>
        <Form.Item name="extraDayPaymentAmountStatus" valuePropName="checked">
          <Checkbox>Extra Day Payment Paid</Checkbox>
        </Form.Item>

        <Form.Item 
  name="aadhaarCard" 
  label="Upload Aadhaar Card" 
  valuePropName="fileList"
  getValueFromEvent={(e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList;
  }}
  rules={[{ required: true, message: 'Please upload Aadhaar card' }]}
>
  <Upload
    maxCount={1}
    beforeUpload={() => false} // Prevent automatic upload
  >
    <Button icon={<UploadOutlined />}>Click to Upload</Button>
  </Upload>
</Form.Item>

<Form.Item 
  name="image" 
  label="Upload Profile Pic" 
  valuePropName="fileList"
  getValueFromEvent={(e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList;
  }}
  rules={[{ required: true, message: 'Please upload Profile Pic' }]}
>
  <Upload
    maxCount={1}
    beforeUpload={() => false} // Prevent automatic upload
  >
    <Button icon={<UploadOutlined />}>Click to Upload</Button>
  </Upload>
</Form.Item>



        <Form.Item label="Due Amount">
          <InputNumber value={dueAmount} readOnly style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" 
          disabled={load}
          >
            Submit
          </Button>
        </Form.Item>
      </Form>

      {showInvoice && invoiceData && (
  <div>
  <div id="invoice-preview" className="invoice-preview">
    {/* <h2>Payment receipt of BEIYO</h2> */}
    <h2 className="invoice-title">Payment receipt of BEIYO</h2>
    {/* HEADER */}
    <header className="invoice-header">
      <div className="bill-to">
        <h3>Resident Details</h3>
        <p><strong>Name:</strong> {invoiceData.name || 'N/A'}</p>
        <p><strong>Permanent Address:</strong> {invoiceData.address || 'N/A'}</p>
      </div>
      <div className="invoice-info">
        <h3>Resident Form Receipt</h3>
        <p>Original for Records</p>
      </div>
    </header>

    {/* FORM DETAILS */}
    <section className="order-invoice-details">
      <div className="left">
        <p><strong>Form ID:</strong> {invoiceData.formID || 'N/A'}</p>
      </div>
      <div className="right">
        <p><strong>Joining Date:</strong> {invoiceData.dateJoined?.format("YYYY-MM-DD") || 'N/A'}</p>
      </div>
    </section>

    {/* ROOM AND HOSTEL DETAILS */}
    <section className="shipping-invoice-details">
      <div className="left">
        <h3>Hostel Details</h3>
        <p><strong>Hostel:</strong> {hostels.find(h => h._id === invoiceData.hostelId)?.name || 'N/A'}</p>
        <p><strong>Room No:</strong> {rooms.find(r => r._id === invoiceData.roomNumberId)?.roomNumber || 'N/A'}</p>
      </div>
      <div className="middle">
        <p><strong>Contract Term:</strong> {invoiceData.contractTerm} months</p>
      </div>
      <div className="right">
        <p><strong>Due Amount:</strong> ₹{dueAmount}</p>
      </div>
    </section>

    {/* PAYMENT DETAILS TABLE */}
    <table className="invoice-table">
      <thead>
        <tr>
          <th>Detail</th>
          <th>Amount</th>
          <th>Paid</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Rent</td>
          <td>₹{invoiceData.rent}</td>
          <td>{invoiceData.depositStatus ? "✅" : "❌"}</td>
        </tr>
        <tr>
          <td>Deposit</td>
          <td>₹{invoiceData.deposit}</td>
          <td>{invoiceData.depositStatus ? "✅" : "❌"}</td>
        </tr>
        <tr>
          <td>Maintenance Charge</td>
          <td>₹{invoiceData.maintainaceCharge}</td>
          <td>{invoiceData.maintainaceChargeStatus ? "✅" : "❌"}</td>
        </tr>
        <tr>
          <td>Form Fee</td>
          <td>₹{invoiceData.formFee}</td>
          <td>{invoiceData.formFeeStatus ? "✅" : "❌"}</td>
        </tr>
        <tr>
          <td>Extra Day Payment</td>
          <td>₹{invoiceData.extraDayPaymentAmount}</td>
          <td>{invoiceData.extraDayPaymentAmountStatus ? "✅" : "❌"}</td>
        </tr>
      </tbody>
    </table>

    {/* TERMS & CONDITIONS */}
    <section className="terms-and-conditions">
      <h3>Notes</h3>
      <p>1. Please review the resident form before submission.</p>
      <p>2. Ensure all details are accurate for smooth processing.</p>
      <p>3. Keep a copy for your records.</p>
    </section>

    {/* BUTTONS */}
  </div>
    <button onClick={downloadPDF} 
    // style={buttonStyle}
    className="download-button"
    >Download Receipt</button>
    <button onClick={sendInvoiceWhatsApp} 
    // style={whatsappButtonStyle}
    className="whatsapp-button"
    >Send via WhatsApp</button>
</div>
)}

    </div>
  );
};

export default ResidentForm;
