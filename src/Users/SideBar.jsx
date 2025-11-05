import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function Sidebar() {
  const [categories, setCategories] = useState([]);
    const {user, accessToken} = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("https://neil-backend-1.onrender.com/products/categories",{
            headers:{
                "Authorization":`Bearer ${accessToken}`
            }
        });
        console.log(res);
        setCategories(res.data.categories);
      } catch (err) {
        console.error("Error loading categories:", err);
      }
    };
    fetchData();
  }, []);

  return (
    <aside className="w-64 bg-white shadow-md p-4">
      <ul>
        {categories.map((cat) => (
          <li key={cat.category} className="mb-2">
            <details>
              <summary className="cursor-pointer font-medium">{cat.category}</summary>
              <ul className="ml-4 mt-2 list-disc">
                {cat.subcategories.length > 0 ? (
                  cat.subcategories.map((sub) => (
                    <li key={sub} className="text-sm text-gray-600">
                      {sub}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400 text-sm">No subcategories</li>
                )}
              </ul>
            </details>
          </li>
        ))}
      </ul>
    </aside>
  );
}
