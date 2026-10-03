// Sample orders for the evaluator
const testOrders = [
  {
    id: "ORD-101",
    info: "Priya Sharma, Vitamin C Serum (30ml), ₹699",
    status: "Out for Delivery. BlueDart BD-982103, expected by 6 PM today",
  },
  {
    id: "ORD-102",
    info: "Rahul Verma, Hydrating Sunscreen SPF 50, ₹499",
    status: "Delivered 14 days ago. Delhivery DL-441029",
  },
  {
    id: "ORD-103",
    info: "Ananya Patel, Green Tea Face Wash + Toner, ₹850",
    status: "Processing. Ordered 3 hours ago, can be cancelled",
  },
];

// Orders panel component
function OrdersPanel() {
  return (
    <div className="box">
      <h2>Test orders</h2>

      {testOrders.map((order) => (
        <div className="order" key={order.id}>
          <p className="order-id">{order.id}</p>
          <p>{order.info}</p>
          <p className="order-status">{order.status}</p>
        </div>
      ))}
    </div>
  );
}

export default OrdersPanel;
