import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Checkbox,
  DatePicker,
  InputNumber,
  Upload,
  Select,
  message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../api/apiKey";
import "./styles/booking-form.css";
import "./styles/InvoicePreview.css";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
const { Option } = Select;
import axios from "axios";

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
  const [load, setLoad] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

  useEffect(() => {
    // Fetch hostels
    const fetchHostels = async () => {
      try {
        const response = await api.get("https://beiyo-admin.in/api/hostels");
        setHostels(response.data);
      } catch (error) {
        message.error("Error fetching hostels: " + error.message);
      }
    };

    fetchHostels();
  }, []);

  const handleHostelChange = async (hostelId) => {
    try {
      const response = await api.get(
        `https://beiyo-admin.in/api/hostels/${hostelId}/remainingCapacityRooms`
      );
      setRooms(response.data);
      form.setFieldsValue({ roomNumberId: null }); // Reset room selection
    } catch (error) {
      message.error("Error fetching rooms: " + error.message);
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
        const selectedDate = date.startOf("day");
        const firstDayOfMonth = dayjs().startOf("month");

        // Check if the selected date is the 1st of the current month
        if (selectedDate.isSame(firstDayOfMonth)) {
          setExtraDayPaymentAmount(0);
          setExtraDays(0);
          form.setFieldsValue({
            extraDayPaymentAmount: 0,
          });
        } else {
          const nextMonth = date.startOf("month").add(1, "month");
          const remainingDays = Math.ceil(nextMonth.diff(date, "days"));
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
    console.log("Form Values:", values);
    setLoad(true);

    setInvoiceData(values); // Store invoice data
    setShowInvoice(true); // Show invoice preview
    const formData = new FormData();

    Object.keys(values).forEach((key) => {
      if (key === "aadhaarCard" || key === "image") {
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

    formData.append("extraDays", extraDays);

    try {
      const response = await api.post(
        "https://beiyo-admin.in/api/newResident",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      message.success("Resident registered successfully!");
      setLoad(false);
      form.resetFields();
    } catch (error) {
      message.error(
        "Error registering resident: " + error.response?.data?.message ||
          error.message
      );
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
      const whatsappURL = `https://wa.me/91${phoneNumber}?text=${encodeURIComponent(
        message
      )}`;

      setTimeout(() => {
        window.open(whatsappURL, "_blank");
      }, 2000); // Small delay to ensure PDF downloads before opening WhatsApp
    });
  };

  const calculateDueAmount = (values) => {
    const {
      deposit,
      maintenanceCharge,
      formFee,
      extraDayPaymentAmount,
      depositStatus,
      maintenanceChargeStatus,
      formFeeStatus,
      extraDayPaymentAmountStatus,
    } = values;
    let totalDue = 0;

    if (!depositStatus) totalDue += deposit || 0;
    if (!maintenanceChargeStatus) totalDue += maintenanceCharge || 0;
    if (!formFeeStatus) totalDue += formFee || 0;
    if (!extraDayPaymentAmountStatus) totalDue += extraDayPaymentAmount || 0;

    setDueAmount(totalDue);
  };

  return (
    <div
      className="form-div"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <Form
        form={form}
        layout="horizontal"
        onValuesChange={calculateDueAmount}
        onFinish={handleFormSubmit}
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: "Please enter the name" }]}
        >
          <Input placeholder="Enter name" />
        </Form.Item>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            {
              required: true,
              type: "email",
              message: "Please enter a valid email",
            },
          ]}
        >
          <Input placeholder="Enter email" />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: "Please enter a valid password" }]}
        >
          <Input.Password placeholder="Enter password" />
        </Form.Item>
        <Form.Item
          name="mobileNumber"
          label="Mobile Number"
          rules={[
            { required: true, message: "Please enter the mobile number" },
          ]}
        >
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

        <Form.Item
          name="hostelId"
          label="Select Hostel"
          rules={[{ required: true, message: "Please select a hostel" }]}
        >
          <Select placeholder="Select a hostel" onChange={handleHostelChange}>
            {hostels.map((hostel) => (
              <Option key={hostel._id} value={hostel._id}>
                {hostel.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="roomNumberId"
          label="Select Room"
          rules={[{ required: true, message: "Please select a room" }]}
        >
          <Select
            placeholder="Select a room"
            disabled={!rooms.length}
            onChange={handleRoomSelect}
          >
            {rooms.map((room) => (
              <Option key={room._id} value={room._id}>
                {room.roomNumber}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="dateJoined"
          label="Date Joined"
          rules={[
            { required: true, message: "Please select the joining date" },
          ]}
        >
          <DatePicker style={{ width: "100%" }} onChange={handleDateChange} />
        </Form.Item>
        <Form.Item name="contractTerm" label="Contract Term (Months)">
          <InputNumber
            min={1}
            placeholder="Enter contract term"
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item name="rent" label="Rent">
          {" "}
          <InputNumber value={rent} readOnly style={{ width: "100%" }} />{" "}
        </Form.Item>
        <Form.Item name="deposit" label="Deposit">
          {" "}
          <InputNumber
            value={deposit}
            readOnly
            style={{ width: "100%" }}
          />{" "}
        </Form.Item>
        <Form.Item name="maintenanceCharge" label="Maintenance Charge">
          <InputNumber
            min={0}
            placeholder="Enter maintenance charge"
            style={{ width: "100%" }}
          />
        </Form.Item>
        <Form.Item name="formFee" label="Form Fee">
          <InputNumber
            min={0}
            placeholder="Enter form fee"
            style={{ width: "100%" }}
          />
        </Form.Item>
        <Form.Item
          name="extraDayPaymentAmount"
          label="Extra Day Payment Amount"
        >
          {" "}
          <InputNumber
            value={extraDayPaymentAmount}
            readOnly
            style={{ width: "100%" }}
          />{" "}
        </Form.Item>
        <Form.Item name="depositStatus" valuePropName="checked">
          <Checkbox>Deposit Paid</Checkbox>
        </Form.Item>
        <Form.Item name="maintenanceChargeStatus" valuePropName="checked">
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
          rules={[{ required: true, message: "Please upload Aadhaar card" }]}
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
          rules={[{ required: true, message: "Please upload Profile Pic" }]}
        >
          <Upload
            maxCount={1}
            beforeUpload={() => false} // Prevent automatic upload
          >
            <Button icon={<UploadOutlined />}>Click to Upload</Button>
          </Upload>
        </Form.Item>

        <Form.Item label="Due Amount">
          <InputNumber value={dueAmount} readOnly style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" disabled={load}>
            Submit
          </Button>
        </Form.Item>
      </Form>

      {showInvoice && invoiceData && (
        //please change margin from top accordingly
        <div>
          {/* invoice preview */}
          <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-lg pt-28 mb-4 px-4 sm:px-6 lg:px-8">
            <header className="border-b-2 border-gray-100 pb-4 mb-6 flex justify-between flex-wrap sm:flex-row flex-col items-center">
              <div className="flex flex-col items-center justify-center">
                <img
                  src="/images/beiyo_logo2.svg"
                  alt="logo"
                  className="w-48 md:w-56 mb-3 justify-center ml-4 sm:ml-0"
                />
                <p className="text-sm text-gray-500">
                  BEIYO TECHNVEN PRIVATE LIMITED
                </p>
              </div>
              <div className="flex flex-col justify-center items-center">
                <h1 className="text-gray-800 sm:text-4xl mt-4 text-xl">
                  INVOICE
                </h1>
                <h1 className="sm:text-2xl text-lg">
                  # {invoiceData.formID || "N/A"}
                </h1>
              </div>
            </header>

            <div className="flex justify-between flex-wrap gap-4 mb-6 relative flex-col sm:flex-row">
              <div className="space-y-1.5">
                <h2 className="text-base font-semibold text-gray-800">
                  Bill To:
                </h2>
                <div className="space-y-1">
                  <p className="text-gray-600">
                    Name :{" "}
                    <span className="font-bold text-black">
                      {invoiceData.name || "N/A"}
                    </span>
                  </p>
                  <p className="text-gray-600">
                    Phone number :{" "}
                    <span className="font-bold text-black"></span>
                  </p>
                  <p className="text-gray-600">
                    Permanent Address :{" "}
                    <span className="font-bold text-black">
                      {invoiceData.address || "N/A"}
                    </span>
                  </p>
                </div>
              </div>
              <div>
                <div>
                  <h3 className="text-base font-semibold text-gray-800">
                    Hostel Details:
                  </h3>
                  <p className="text-gray-600">
                    Hostel :
                    <span className="font-bold text-black">
                      {hostels.find((h) => h._id === invoiceData.hostelId)
                        ?.name || "N/A"}
                    </span>
                  </p>
                  <p className="text-gray-600">
                    Room No. :{" "}
                    <span className="font-bold text-black">
                      {rooms.find((r) => r._id === invoiceData.roomNumberId)
                        ?.roomNumber || "N/A"}
                    </span>
                  </p>
                  <p className="text-gray-600">
                    Contract Term :{" "}
                    <span className="font-bold text-black">
                      {" "}
                      {invoiceData.contractTerm} months
                    </span>
                  </p>
                </div>
              </div>
              <div className="mt-2 md:mt-0">
                <div className=" flex flex-col justify-center items-center absolute -top-1 right-0">
                  <h2 className="text-base font-semibold text-gray-800">
                    Date:
                  </h2>
                  <p className="text-gray-600">
                    {invoiceData.dateJoined?.format("YYYY-MM-DD") || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6 bg-[#eee] p-4 rounded-lg sm:w-fit w-fit md:w-fit">
              <div className="flex md:flex-row items-start md:items-center gap-4">
                <h2 className="text-base font-semibold text-gray-800 whitespace-nowrap">
                  Balance Due:
                </h2>
                <p className="text-xl font-semibold text-gray-900">
                  ₹ {isNaN(dueAmount) ? 0 : dueAmount}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full min-w-[500px]">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                      Details
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-white">
                      Paid
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      Security Deposit
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      ₹{invoiceData.deposit}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                      {invoiceData.depositStatus ? "✅" : "❌"}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">Rent</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      ₹{invoiceData.rent}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                      {invoiceData.depositStatus ? "✅" : "❌"}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      Maintenance Fee
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      ₹{invoiceData.maintenanceCharge}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                      {invoiceData.maintenanceChargeStatus ? "✅" : "❌"}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      Form Fee
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      ₹{invoiceData.formFee}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                      {invoiceData.formFeeStatus ? "✅" : "❌"}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      Extra Day Payment
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      ₹{invoiceData.extraDayPaymentAmount}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                      {invoiceData.extraDayPaymentAmountStatus ? "✅" : "❌"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 max-w-xs md:max-w-sm ml-auto justify-center items-center">
              <div className="space-y-4 text-right">
                <h2 className="text-base font-semibold text-gray-800">
                  Total:
                </h2>
                <h2 className="text-base font-semibold text-gray-800">
                  Amount Paid:
                </h2>
              </div>
              <div className="space-y-3 text-right mr-4">
                <p className="text-xl font-bold text-gray-900">
                  ₹
                  {invoiceData &&
                    [
                      invoiceData.deposit,
                      invoiceData.dueAmount,
                      invoiceData.maintenanceCharge,
                      invoiceData.rent,
                      invoiceData.extraDayPaymentAmount,
                    ]
                      .map(Number)
                      .reduce(
                        (sum, value) => sum + (isNaN(value) ? 0 : value), //koi bhi value NaN na ho
                        0
                      )}
                </p>
                <p className="text-xl font-bold text-gray-900">
                  ₹
                  {[
                    invoiceData?.deposit || 0,
                    invoiceData?.maintenanceCharge || 0,
                    invoiceData?.rent || 0,
                    invoiceData?.extraDayPaymentAmount || 0,
                  ].reduce((sum, value) => sum + value, 0) -
                    (invoiceData?.dueAmount || 0)}
                </p>
              </div>
            </div>

            {/* TERMS & CONDITIONS */}
            <section className="terms-and-conditions">
              <h3>Notes</h3>
              <p>1. Please review the resident form before submission.</p>
              <p>2. Ensure all details are accurate for smooth processing.</p>
              <p>3. Keep a copy for your records.</p>
            </section>
          </div>

          {/* BUTTONS */}
          <button
            onClick={downloadPDF}
            // style={buttonStyle}
            className="download-button"
          >
            Download Receipt
          </button>
          <button
            onClick={sendInvoiceWhatsApp}
            // style={whatsappButtonStyle}
            className="whatsapp-button"
          >
            Send via WhatsApp
          </button>
        </div>
      )}
    </div>
  );
};

export default ResidentForm;
