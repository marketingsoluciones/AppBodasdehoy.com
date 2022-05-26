

export default function handler(req, res) {

    try {
        let otro = 3
        if(otro > 1) {
            throw new Error("Hola mundo")
        } else {
            res.status(200).json({ name: 'John Doe' })
        }
    } catch (error) {
        res.status(400).json({ error: error })
        console.log(error)
        return error
    } finally {
        
    }

  }