import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const response = await authApi.register({ name, email, password, role });
      login(response.data.token, response.data.user);
      navigate("/");
    } catch (err) {
      setError("Unable to register.");
    }
  };

  return (
    <section className="page narrow">
      <div className="card">
        <div className="card-title">Create your account</div>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Name
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <label>
            Role
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="customer">Customer</option>
              <option value="shopkeeper">Shopkeeper</option>
            </select>
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="primary-btn" type="submit">
            Register
          </button>
        </form>
      </div>
    </section>
  );
};

export default Register;
