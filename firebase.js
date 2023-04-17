import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDVMoVLWWvolofYOcTYA0JZ0QHyng72LAM",
  authDomain: "bodasdehoy-1063.firebaseapp.com",
  databaseURL: "https://bodasdehoy-1063-default-rtdb.firebaseio.com",
  projectId: "bodasdehoy-1063",
  storageBucket: "bodasdehoy-1063.appspot.com",
  messagingSenderId: "593952495916",
  appId: "1:593952495916:web:c63cf15fd16a6796f6f489",
  measurementId: "G-GWQ17NF2YR",
};


const firebaseClient = initializeApp(firebaseConfig);
console.log(10021, firebaseClient)
const auth = getAuth(firebaseClient)

export { firebaseClient, auth };
