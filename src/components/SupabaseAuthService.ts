@@ .. @@
     } catch (error) {
-      console.error('🚨 Auth Error Details:', err);
+      console.error('Auth Error:', err);
       let errorMessage = 'An error occurred';
       
       if (err instanceof Error) {
         errorMessage = err.message;
-        console.error('🚨 Error message:', errorMessage);
         
-        // Provide more user-friendly error messages
         if (errorMessage.includes('Invalid login credentials')) {
           errorMessage = 'Invalid email or password. If you haven\'t created an account yet, please sign up first.';
         } else if (errorMessage.includes('Email not confirmed')) {