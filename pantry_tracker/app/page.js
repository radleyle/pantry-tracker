'use client'
import { useState, useEffect } from 'react'
import { firestore } from '@/firebase'
import { Box, Button, Modal, Stack, TextField, Typography, Paper, Alert } from '@mui/material'
import { collection, deleteDoc, getDocs, doc, query, getDoc, setDoc } from "firebase/firestore"

export default function Home() {
  const [inventory, setInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [quantityThreshold, setQuantityThreshold] = useState(1)
  const [alerts, setAlerts] = useState([])

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'))
    const docs = await getDocs(snapshot)
    const inventoryList = []
    const newAlerts = []

    docs.forEach((doc) => {
      const data = doc.data()
      const item = {
        name: doc.id,
        ...data,
      }
      inventoryList.push(item)

      // Check expiration date
      if (data.expirationDate) {
        const expiration = new Date(data.expirationDate)
        if (expiration <= new Date()) {
          newAlerts.push(`${item.name} has expired!`)
        } else if ((expiration - new Date()) / (1000 * 60 * 60 * 24) <= 3) {
          newAlerts.push(`${item.name} is expiring soon!`)
        }
      }

      // Check quantity threshold
      if (data.quantity <= data.threshold) {
        newAlerts.push(`${item.name} is below the quantity threshold!`)
      }
    })

    setInventory(inventoryList)
    setAlerts(newAlerts)
  }

  const addItem = async (item, expirationDate, quantityThreshold) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()){
      const { quantity } = docSnap.data()
      await setDoc(docRef, { quantity: quantity + 1, expirationDate, threshold: quantityThreshold })
    } else {
      await setDoc(docRef, { quantity: 1, expirationDate, threshold: quantityThreshold })
    }

    await updateInventory()
  }

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()){
      const { quantity } = docSnap.data()
      if (quantity === 1) {
        await deleteDoc(docRef)
      } else {
        await setDoc(docRef, { quantity: quantity - 1 })
      }
    }

    await updateInventory()
  }

  useEffect(() => {
    updateInventory()
  }, [])

  const handleOpen = () => setOpen(true)
  const handleClose = () => {
    setOpen(false)
    setItemName('')
    setExpirationDate('')
    setQuantityThreshold(1)
  }

  return (
    <Box 
      width="100vw" 
      height="100vh" 
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      gap={2}
      bgcolor="#f7f7f7"
    >
      {alerts.map((alert, index) => (
        <Alert severity="warning" key={index}>{alert}</Alert>
      ))}
      <Modal open={open} onClose={handleClose}>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          width={400}
          bgcolor="background.paper"
          boxShadow={24}
          p={4}
          borderRadius={2}
        >
          <Typography variant="h6" component="h2" mb={2}>
            Add a New Item
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Item Name"
              variant="outlined"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              fullWidth
            />
            <TextField
              label="Expiration Date"
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Quantity Threshold"
              type="number"
              value={quantityThreshold}
              onChange={(e) => setQuantityThreshold(Number(e.target.value))}
              fullWidth
            />
            <Button 
              variant="contained" 
              onClick={async () => {
                await addItem(itemName, expirationDate, quantityThreshold)
                handleClose()
              }}
              fullWidth
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>
      <Button 
        variant="contained"
        onClick={handleOpen}
        sx={{ mb: 2 }}
      >
        Add New Item
      </Button>
      <Paper elevation={3} sx={{ p: 2, width: '80%', maxWidth: '800px' }}>
        <Box 
          height="60px" 
          bgcolor="#ADD8E6"
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius="4px 4px 0 0"
        >
          <Typography variant="h4" color="#333">
            Inventory Items
          </Typography>
        </Box>
        <Stack width="100%" maxHeight="400px" spacing={2} overflow="auto" mt={2} p={2}>
          {inventory.map(({ name, quantity, expirationDate, threshold }) => (
            <Box 
              key={name}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              bgcolor="#f0f0f0"
              padding={2}
              borderRadius={2}
              boxShadow={1}
            >
              <Box>
                <Typography variant="h6" color="#333">
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {expirationDate ? `Expires on: ${new Date(expirationDate).toLocaleDateString()}` : 'No expiration date'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Threshold: {threshold}
                </Typography>
              </Box>
              <Typography variant="h6" color="#333">
                {quantity}
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => addItem(name, expirationDate, threshold)}
                >
                  Add
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => removeItem(name)}
                >
                  Remove
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Paper>
    </Box>
  )
}
