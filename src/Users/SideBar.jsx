import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function Sidebar() {
  const [categories, setCategories] = useState([]);
  const { accessToken, user } = useContext(AuthContext);

  useEffect(() => {
    const orgId = user.org_id;
    const fetchCategories = async () => {
      try {
        const res = await axios.post(
          "https://neil-backend-1.onrender.com/sidebar/categories",
          { orgId }, // sending orgId in body
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (res.data.success && Array.isArray(res.data.categories)) {
          setCategories(res.data.categories);
        } else {
          console.warn("⚠️ Unexpected API response:", res.data);
          setCategories([]);
        }
      } catch (error) {
        console.error("❌ Error fetching categories:", error);
        setCategories([]);
      }
    };

    if (accessToken && orgId) {
      fetchCategories();
    }
  }, [accessToken, orgId]);

  return (
    <aside className="w-64 bg-white shadow-md p-4 overflow-y-auto h-screen">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Categories</h2>

      {categories.length === 0 ? (
        <p className="text-gray-500 text-sm">No categories found.</p>
      ) : (
        <ul>
          {categories.map((cat) => (
            <li key={cat.id} className="mb-3">
              <details>
                <summary className="cursor-pointer font-medium text-gray-700">
                  {cat.title}
                </summary>
                <ul className="ml-5 mt-2 list-disc">
                  {cat.subcategories?.length > 0 ? (
                    cat.subcategories.map((sub) => (
                      <li key={sub.id} className="text-sm text-gray-600">
                        {sub.title}
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-400 text-sm">
                      No subcategories
                    </li>
                  )}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
