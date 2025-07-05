import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  isGuest: boolean;
  token?: string;
  guestId: string; // Add guestId for guest users
}

export class AuthService {
  private static readonly STORAGE_KEY = 'ai_animation_user';
  private static readonly GOOGLE_CLIENT_ID =import.meta.env.VITE_GOOGLE_CLIENT_ID;

  static getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored);
        // Validate user object structure
        if (user && typeof user.id === 'string' && typeof user.isGuest === 'boolean') {
          return user;
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      // Clear corrupted data
      localStorage.removeItem(this.STORAGE_KEY);
      return null;
    }
  }

  static createGuestUser(): User {
    const guestId = `guest_${uuidv4()}`;
    const guestUser: User = {
      id:"0",
      name: 'Guest User',
      email: '',
      isGuest: true,
      guestId: guestId
    };
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(guestUser));
    } catch (error) {
      console.error('Error saving guest user:', error);
    }
    
    return guestUser;
  }

  static async initializeGoogleAuth(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Google Auth can only be initialized in browser'));
        return;
      }

      // Check if already loaded
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: this.GOOGLE_CLIENT_ID,
            callback: this.handleGoogleResponse.bind(this),
            auto_select: false,
            cancel_on_tap_outside: true
          });
          resolve();
        } catch (error) {
          reject(error);
        }
        return;
      }

      // Load Google Identity Services script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        try {
          if (window.google?.accounts?.id) {
            window.google.accounts.id.initialize({
              client_id: this.GOOGLE_CLIENT_ID,
              callback: this.handleGoogleResponse.bind(this),
              auto_select: false,
              cancel_on_tap_outside: true
            });
            resolve();
          } else {
            reject(new Error('Google Identity Services failed to load'));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Identity Services script'));
      };
      
      // Only add script if it doesn't exist
      if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        document.head.appendChild(script);
      } else {
        resolve();
      }
    });
  }

  static async signInWithGoogle(currentUser?: User): Promise<User> {
    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.id) {
        reject(new Error('Google Identity Services not loaded'));
        return;
      }

      try {
        // Store current user for use in callback
        (window as any).currentUserForAuth = currentUser;
        
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback to popup - create a temporary button
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'absolute';
            tempDiv.style.top = '-9999px';
            document.body.appendChild(tempDiv);
            
            window.google.accounts.id.renderButton(tempDiv, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              text: 'signin_with',
              shape: 'rectangular',
              logo_alignment: 'left'
            });
            
            // Trigger click
            const button = tempDiv.querySelector('div[role="button"]') as HTMLElement;
            if (button) {
              button.click();
            }
            
            // Clean up
            setTimeout(() => {
              document.body.removeChild(tempDiv);
            }, 1000);
          }
        });

        // Store resolve/reject for callback
        (window as any).authResolve = resolve;
        (window as any).authReject = reject;
        
        // Set timeout for auth
        setTimeout(() => {
          if ((window as any).authReject) {
            (window as any).authReject(new Error('Authentication timeout'));
            delete (window as any).authResolve;
            delete (window as any).authReject;
            delete (window as any).currentUserForAuth;
          }
        }, 30000); // 30 second timeout
        
      } catch (error) {
        reject(error);
      }
    });
  }

  private static async handleGoogleResponse(response: any): Promise<void> {
    try {
      if (!response?.credential) {
        throw new Error('No credential received from Google');
      }

      // Get the current user that was stored during sign-in
      const currentUser = (window as any).currentUserForAuth;

      // Decode the JWT token to get user info
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      
      // Prepare request body with guestId if available
      const requestBody: any = {
        googleToken: response.credential,
        userInfo: {
          id: payload.sub,
          name: payload.name,
          email: payload.email,
          picture: payload.picture
        }
      };

      // Include guestId if current user is a guest
      if (currentUser?.isGuest && currentUser?.guestId) {
        requestBody.guestId = currentUser.guestId;
      }
      
      // Send to backend for verification and get our JWT
      const backendResponse = await fetch('http://localhost:8080/api/auth/google-authorize', {
        method: 'POST',
        headers: this.getAuthHeaders(currentUser),
        body: JSON.stringify(requestBody),
      });

      if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        throw new Error(`Backend authentication failed: ${errorText}`);
      }

      const { userId, token } = await backendResponse.json();

      const user: User = {
        id: userId.toString(),
        name: payload.name || 'Unknown User',
        email: payload.email || '',
        picture: payload.picture,
        isGuest: false,
        token: token,
        guestId: "" // Authenticated users have empty guestId
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));

      // Resolve the promise from signInWithGoogle
      if ((window as any).authResolve) {
        (window as any).authResolve(user);
        delete (window as any).authResolve;
        delete (window as any).authReject;
        delete (window as any).currentUserForAuth;
      }
    } catch (error) {
      console.error('Google auth error:', error);
      if ((window as any).authReject) {
        (window as any).authReject(error);
        delete (window as any).authResolve;
        delete (window as any).authReject;
        delete (window as any).currentUserForAuth;
      }
    }
  }

  static signOut(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      
      // Sign out from Google
      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
      }
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  }

  static getAuthHeaders(user: User | null): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (user) {
      if (user.isGuest && user.guestId) {
        // For guest users, send guestId in header
        headers['guestId'] = user.guestId;
      } else if (!user.isGuest && user.token) {
        // For authenticated users, send JWT token
        headers['Authorization'] = `Bearer ${user.token}`;
      }
    }

    return headers;
  }

  // Remove getUserId method since we don't send userId anymore
  static getGuestId(user: User | null): string | null {
    if (!user) {
      // Create a guest user if none exists
      const guestUser = this.createGuestUser();
      return guestUser.guestId || null;
    }
    return user.isGuest ? user.guestId || null : null;
  }
}

// Extend window interface for Google Identity Services
declare global {
  interface Window {
    google: any;
  }
}