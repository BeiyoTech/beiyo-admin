// import React, { useState, useEffect } from 'react';
// import { Table, Input, Button, Form, Modal, Space, Select, DatePicker, message } from 'antd';

// import moment from 'moment';
// import api from '../../api/apiKey';

// const { Option } = Select;

// const MonthlyExpenses = () => {
//   const [hostels, setHostels] = useState([]);
//   const [selectedHostel, setSelectedHostel] = useState(null);
//   const [expenses, setExpenses] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [form] = Form.useForm();

//   // Fetch all hostels
//   const fetchHostels = async () => {
//     try {
//       const response = await api.get('https://beiyo-admin.in/api/hostels');
//       setHostels(response.data);
//     } catch (error) {
//       message.error('Error fetching hostels');
//       console.error(error);
//     }
//   };

//   // Fetch expenses for the selected hostel
//   const fetchExpenses = async () => {
//     if (!selectedHostel) return;

//     setLoading(true);
//     try {
//       const response = await api.get(`https://beiyo-admin.in/api/hostels/${selectedHostel}/expenses`);
//       setExpenses(response.data.data);
//     } catch (error) {
//       message.error('Error fetching expenses');
//       console.error(error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Add a new expense
//     const addExpense = async (values) => {
//         try {
//           const formattedValues = {
//             ...values,
//             month: values.month.format('YYYY-MM'), // Format the month for storage
//           };
//           await api.post(`https://beiyo-admin.in/api/hostels/${selectedHostel}/expenses`, formattedValues);
//           message.success('Expense added successfully!');
//           fetchExpenses();
//           setIsModalVisible(false);
//         } catch (error) {
//           if (error.response?.status === 400 && error.response.data?.message?.includes('duplicate')) {
//             message.error('Expense for this month already exists.');
//           } else {
//             message.error('Error adding expense');
//             console.error(error);
//           }
//         }
//       };
  

//   // Update an expense
//   const updateExpense = async (updatedExpense) => {
//     try {
//       await api.put(
//         `https://beiyo-admin.in/api/hostels/${selectedHostel}/expenses/${updatedExpense.month}`,
//         updatedExpense
//       );
//       message.success('Expense updated successfully!');
//       fetchExpenses();
//     } catch (error) {
//       message.error('Error updating expense');
//       console.error(error);
//     }
//   };

//   const handleSave = (record) => {
//     updateExpense(record);
//   };

//   const handleAdd = () => {
//     const selectedMonth = form.getFieldValue('month').format('YYYY-MM');
//     if (expenses.some((exp) => exp.month === selectedMonth)) {
//       message.error('Expense for this month already exists!');
//       return;
//     }
  
//     form.validateFields()
//       .then((values) => {
//         addExpense(values);
//         form.resetFields();
//       })
//       .catch((error) => console.error('Validation Failed:', error));
//   };

//   const handleHostelChange = (value) => {
//     setSelectedHostel(value);
//     setExpenses([]);
//   };

//   useEffect(() => {
//     fetchHostels();
//   }, []);

//   useEffect(() => {
//     fetchExpenses();
//   }, [selectedHostel]);

//   const columns = [
//     {
//       title: 'Month',
//       dataIndex: 'month',
//       key: 'month',
//       render: (_, record) => (
//         <Input
//           value={record.month}
//           disabled
//         />
//       )
//     },
//     {
//       title: 'Maintenance Cost',
//       dataIndex: 'maintenanceCost',
//       key: 'maintenanceCost',
//       render: (_, record) => (
//         <Input
//           type="number"
//           value={record.maintenanceCost}
//           onChange={(e) =>
//             setExpenses((prev) =>
//               prev.map((exp) =>
//                 exp.month === record.month
//                   ? { ...exp, maintenanceCost: +e.target.value }
//                   : exp
//               )
//             )
//           }
//         />
//       )
//     },
//     {
//       title: 'Utility Cost',
//       dataIndex: 'utilityCost',
//       key: 'utilityCost',
//       render: (_, record) => (
//         <Input
//           type="number"
//           value={record.utilityCost}
//           onChange={(e) =>
//             setExpenses((prev) =>
//               prev.map((exp) =>
//                 exp.month === record.month
//                   ? { ...exp, utilityCost: +e.target.value }
//                   : exp
//               )
//             )
//           }
//         />
//       )
//     },
//     {
//       title: 'Total Cost',
//       dataIndex: 'totalCost',
//       key: 'totalCost',
//       render: (_, record) => (
//         <Input
//           value={Number(record.maintenanceCost + record.utilityCost)}
//           disabled
//         />
//       )
//     },
//     {
//       title: 'Kapex',
//       dataIndex: 'kapex',
//       key: 'kapex',
//       render: (_, record) => (
//         <Input
//           value={record.kapex}
//                     onChange={(e) =>
//             setExpenses((prev) =>
//               prev.map((exp) =>
//                 exp.month === record.month
//                   ? { ...exp, kapex: +e.target.value }
//                   : exp
//               )
//             )
//           }
//         />
//       )
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (_, record) => (
//         <Button type="primary" onClick={() => handleSave(record)}>
//           Update
//         </Button>
//       )
//     }
//   ];

//   return (
//     <div style={{ padding: '20px' }}>
//       <h2>Monthly Expenses</h2>
//       <Space style={{ marginBottom: '20px' }}>
//         <Select
//           placeholder="Select Hostel"
//           style={{ width: '300px' }}
//           onChange={handleHostelChange}
//           allowClear
//         >
//           {hostels.map((hostel) => (
//             <Option key={hostel._id} value={hostel._id}>
//               {hostel.name}
//             </Option>
//           ))}
//         </Select>
//         <Button
//           type="primary"
//           onClick={() => setIsModalVisible(true)}
//           disabled={!selectedHostel}
//         >
//           Add New Expense
//         </Button>
//       </Space>

//       {selectedHostel && (
//         <Table
//           dataSource={expenses}
//           columns={columns}
//           rowKey="month"
//           loading={loading}
//           pagination={{ pageSize: 5 }}
//         />
//       )}

//       <Modal
//         title="Add New Expense"
//         visible={isModalVisible}
//         onCancel={() => setIsModalVisible(false)}
//         footer={null}
//       >
//         <Form form={form} layout="vertical" onFinish={handleAdd}>
//           <Form.Item
//             name="month"
//             label="Month"
//             rules={[{ required: true, message: 'Please select a month!' }]}
//           >
//             <DatePicker picker="month" style={{ width: '100%' }} />
//           </Form.Item>
//           <Form.Item
//             name="maintenanceCost"
//             label="Maintenance Cost"
//             rules={[{ required: true, message: 'Please enter maintenance cost!' }]}
//           >
//             <Input type="number" />
//           </Form.Item>
//           <Form.Item
//             name="utilityCost"
//             label="Utility Cost"
//             rules={[{ required: true, message: 'Please enter utility cost!' }]}
//           >
//             <Input type="number" />
//           </Form.Item>
//           <Form.Item
//             name="kapex"
//             label="Kapex"
//             rules={[{ required: true, message: 'Please enter kapex cost!' }]}
//           >
//             <Input type="number" />
//           </Form.Item>
//           <Form.Item>
//             <Button type="primary" htmlType="submit">
//               Add Expense
//             </Button>
//           </Form.Item>
//         </Form>
//       </Modal>
//     </div>
//   );
// };

// export default MonthlyExpenses;

import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Form, Modal, Space, Select, DatePicker, message, Row, Col } from 'antd';
import useFetchHostels from '../hooks/useFetchHostels';
import moment from 'moment';
import api from '../../api/apiKey';

const { Option } = Select;

const MonthlyExpenses = () => {
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Fetch all hostels
  // const fetchHostels = async () => {
  //   try {
  //     const response = await api.get('https://beiyo-admin.in/api/hostels');
  //     setHostels(response.data);
  //   } catch (error) {
  //     message.error('Error fetching hostels');
  //     console.error(error);
  //   }
  // };

  const fetchHostels = useFetchHostels()

  // Fetch expenses for the selected hostel
  const fetchExpenses = async () => {
    if (!selectedHostel) return;

    setLoading(true);
    try {
      const response = await api.get(`https://beiyo-admin.in/api/hostels/${selectedHostel}/expenses`);
      setExpenses(response.data.data);
    } catch (error) {
      message.error('Error fetching expenses');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Add a new expense
  const addExpense = async (values) => {
    try {
      const formattedValues = {
        ...values,
        month: values.month.format('YYYY-MM'), // Format the month for storage
      };
      await api.post(`https://beiyo-admin.in/api/hostels/${selectedHostel}/expenses`, formattedValues);
      message.success('Expense added successfully!');
      fetchExpenses();
      setIsModalVisible(false);
    } catch (error) {
      if (error.response?.status === 400 && error.response.data?.message?.includes('duplicate')) {
        message.error('Expense for this month already exists.');
      } else {
        message.error('Error adding expense');
        console.error(error);
      }
    }
  };

  // Update an expense
  const updateExpense = async (updatedExpense) => {
    try {
      await api.put(
        `https://beiyo-admin.in/api/hostels/${selectedHostel}/expenses/${updatedExpense.month}`,
        updatedExpense
      );
      message.success('Expense updated successfully!');
      fetchExpenses();
    } catch (error) {
      message.error('Error updating expense');
      console.error(error);
    }
  };

  const handleSave = (record) => {
    updateExpense(record);
  };

  const handleAdd = () => {
    const selectedMonth = form.getFieldValue('month').format('YYYY-MM');
    if (expenses.some((exp) => exp.month === selectedMonth)) {
      message.error('Expense for this month already exists!');
      return;
    }

    form.validateFields()
      .then((values) => {
        addExpense(values);
        form.resetFields();
      })
      .catch((error) => console.error('Validation Failed:', error));
  };

  const handleHostelChange = (value) => {
    setSelectedHostel(value);
    setExpenses([]);
  };

  useEffect(() => {
    fetchHostels;
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [selectedHostel]);

  const columns = [
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
      render: (_, record) => (
        <Input
          value={record.month}
          disabled
        />
      )
    },
    {
      title: 'Maintenance Cost',
      dataIndex: 'maintenanceCost',
      key: 'maintenanceCost',
      render: (_, record) => (
        <Input
          type="number"
          value={record.maintenanceCost}
          onChange={(e) =>
            setExpenses((prev) =>
              prev.map((exp) =>
                exp.month === record.month
                  ? { ...exp, maintenanceCost: +e.target.value }
                  : exp
              )
            )
          }
        />
      )
    },
    {
      title: 'Utility Cost',
      dataIndex: 'utilityCost',
      key: 'utilityCost',
      render: (_, record) => (
        <Input
          type="number"
          value={record.utilityCost}
          onChange={(e) =>
            setExpenses((prev) =>
              prev.map((exp) =>
                exp.month === record.month
                  ? { ...exp, utilityCost: +e.target.value }
                  : exp
              )
            )
          }
        />
      )
    },
    {
      title: 'Total Cost',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (_, record) => (
        <Input
          value={Number(record.maintenanceCost + record.utilityCost)}
          disabled
        />
      )
    },
    {
      title: 'Kapex',
      dataIndex: 'kapex',
      key: 'kapex',
      render: (_, record) => (
        <Input
          value={record.kapex}
          onChange={(e) =>
            setExpenses((prev) =>
              prev.map((exp) =>
                exp.month === record.month
                  ? { ...exp, kapex: +e.target.value }
                  : exp
              )
            )
          }
        />
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button type="primary" onClick={() => handleSave(record)}>
          Update
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h2>Monthly Expenses</h2>
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col xs={24} md={12}>
          <Select
            placeholder="Select Hostel"
            style={{ width: '100%' }}
            onChange={handleHostelChange}
            allowClear
          >
            {hostels.map((hostel) => (
              <Option key={hostel._id} value={hostel._id}>
                {hostel.name}
              </Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} md={12}>
          <Button
            type="primary"
            onClick={() => setIsModalVisible(true)}
            disabled={!selectedHostel}
            style={{ width: '100%' }}
          >
            Add New Expense
          </Button>
        </Col>
      </Row>

      {selectedHostel && (
        <Table
          dataSource={expenses}
          columns={columns}
          rowKey="month"
          loading={loading}
          pagination={{ pageSize: 5 }}
        />
      )}

      <Modal
        title="Add New Expense"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item
            name="month"
            label="Month"
            rules={[{ required: true, message: 'Please select a month!' }]}
          >
            <DatePicker picker="month" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="maintenanceCost"
            label="Maintenance Cost"
            rules={[{ required: true, message: 'Please enter maintenance cost!' }]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item
            name="utilityCost"
            label="Utility Cost"
            rules={[{ required: true, message: 'Please enter utility cost!' }]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item
            name="kapex"
            label="Kapex"
            rules={[{ required: true, message: 'Please enter kapex cost!' }]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
              Add Expense
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MonthlyExpenses;
