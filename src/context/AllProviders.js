import { AuthProvider } from "./AuthContext";
import { CartProvider } from "./CartContext";


export const AllProviders = ({children}) => {
    return(
        <AuthProvider>
            <CartProvider>{children}</CartProvider>
        </AuthProvider>
    );
};
