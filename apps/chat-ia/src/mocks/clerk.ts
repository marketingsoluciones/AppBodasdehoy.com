// Mock de Clerk para evitar errores de compilación
export const ClerkProvider = ({ children }: { children: React.ReactNode }) => children;
export const SignInButton = () => null;
export const SignUpButton = () => null;
export const UserButton = () => null;
export const useUser = () => ({ isLoaded: true, isSignedIn: false, user: null });
export const useAuth = () => ({ isLoaded: true, isSignedIn: false, userId: null });
export const clerkMiddleware = () => (req: any) => req;
export const createRouteMatcher = () => () => false;
export const auth = () => ({ userId: null });
export default { ClerkProvider };
