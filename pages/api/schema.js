const mongoose = require("mongoose");

const childSchema = new mongoose.Schema({ name: "string" });

const PadreSchema = new mongoose.Schema({
  // Array of subdocuments
  children: [childSchema],
});

const PadreModelo = mongoose.models.padre || mongoose.model('padre', PadreSchema);          

PadreModelo.updateMany({
  "children.name": "Francisco"
},
{
  $set: {
    "children.$.apellido": "Jafet"
  }
}) .then (response => console.log(response))
  .catch (err => console.log(err))




export default (req, res) => {
  res.status(200).json({ name: "John Doe" });
};
` `