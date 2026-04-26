import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const response = await authApi.login({ email, password });
      login(response.data.token, response.data.user);
      navigate("/");
    } catch (err) {
      setError("Invalid credentials.");
    }
  };

  return (
    <section className="page narrow">
      <div className="card">
        <div className="card-title">Welcome back</div>
        <form onSubmit={handleSubmit} className="form">
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
          {error ? <p className="error">{error}</p> : null}
          <button className="primary-btn" type="submit">
            Login
          </button>
        </form>
      </div>
    </section>
  );
};

export default Login;
