// Styled-jsx type declarations for <style jsx> and <style jsx global> support
// These types were removed/not auto-loaded in @types/react >=19.2.9

import 'react';

declare module 'react' {
  interface StyleHTMLAttributes<T> {
    jsx?: boolean;
    global?: boolean;
  }
}
