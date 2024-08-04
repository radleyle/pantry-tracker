'use client'
import { useState, useEffect } from 'react'
import { firestore } from '@/firebase'
import { Box, Button, Modal, Stack, TextField, Typography, Paper, Alert, Select, MenuItem, InputAdornment, IconButton } from '@mui/material'
import { collection, deleteDoc, getDocs, doc, query, getDoc, setDoc } from "firebase/firestore"
import SearchIcon from '@mui/icons-material/Search'
import WelcomePage from './WelcomePage'

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true)
  const [inventory, setInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [quantityThreshold, setQuantityThreshold] = useState(1)
  const [alerts, setAlerts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortType, setSortType] = useState('name')

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
      await setDoc(docRef, { 
        quantity: quantity + 1, 
        expirationDate: expirationDate || null, 
        threshold: quantityThreshold || 1 
      }, { merge: true })
    } else {
      await setDoc(docRef, { 
        quantity: 1, 
        expirationDate: expirationDate || null, 
        threshold: quantityThreshold || 1 
      })
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
        await setDoc(docRef, { quantity: quantity - 1 }, { merge: true })
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

  const filteredInventory = inventory
    .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortType === 'name') {
        return a.name.localeCompare(b.name)
      } else if (sortType === 'quantity') {
        return b.quantity - a.quantity
      }
      return 0
    })

  if (showWelcome) {
    return <WelcomePage onContinue={() => setShowWelcome(false)} />
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
      bgcolor="#ffffff"
    >
      {alerts.map((alert, index) => (
        <Alert severity="warning" key={index} sx={{ width: '80%', maxWidth: '600px', mb: 2 }}>{alert}</Alert>
      ))}
      <Modal open={open} onClose={handleClose}>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          width={400}
          bgcolor="#ffffff"
          boxShadow={24}
          p={4}
          borderRadius={2}
        >
          <Typography variant="h6" component="h2" mb={2} color="#000000">
            Add a New Item
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Item Name"
              variant="outlined"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              InputProps={{ style: { color: '#000000' } }}
            />
            <TextField
              label="Expiration Date"
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              InputProps={{ style: { color: '#000000' } }}
            />
            <TextField
              label="Quantity Threshold"
              type="number"
              value={quantityThreshold}
              onChange={(e) => setQuantityThreshold(Number(e.target.value))}
              fullWidth
              InputLabelProps={{ shrink: true }}
              InputProps={{ style: { color: '#000000' } }}
            />
            <Button 
              variant="contained" 
              onClick={async () => {
                await addItem(itemName, expirationDate, quantityThreshold)
                handleClose()
              }}
              fullWidth
              sx={{ backgroundColor: '#000000', color: '#ffffff' }}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        width="80%" 
        maxWidth="800px" 
        mb={2}
      >
        <TextField
          variant="outlined"
          placeholder="Search item"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconButton>
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            ),
            style: { color: '#000000' }
          }}
          sx={{ width: '60%', bgcolor: '#ffffff' }}
        />
        <Select
          value={sortType}
          onChange={(e) => setSortType(e.target.value)}
          sx={{ width: '30%', bgcolor: '#ffffff', color: '#000000' }}
        >
          <MenuItem value="name">Sort by Name</MenuItem>
          <MenuItem value="quantity">Sort by Quantity</MenuItem>
        </Select>
      </Box>
      <Button 
        variant="contained"
        onClick={handleOpen}
        sx={{ mb: 2, backgroundColor: '#000000', color: '#ffffff' }}
      >
        Add New Item
      </Button>
      <Paper elevation={3} sx={{ p: 2, width: '80%', maxWidth: '800px', backgroundColor: '#f8f8f8' }}>
        <Box 
          height="60px" 
          bgcolor="#000000"
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius="4px 4px 0 0"
        >
          <Typography variant="h4" color="#ffffff">
            Inventory Items
          </Typography>
        </Box>
        <Stack width="100%" p={2}>
          {filteredInventory.map(item => (
            <Box
              key={item.name}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
              p={2}
              border="1px solid #000000"
              borderRadius="4px"
              bgcolor="#ffffff"
            >
              <Typography variant="h6" color="#000000">{item.name}</Typography>
              <Typography variant="body1" color="#000000">Quantity: {item.quantity}</Typography>
              <Button 
                variant="contained"
                onClick={() => removeItem(item.name)}
                sx={{ backgroundColor: '#000000', color: '#ffffff' }}
              >
                Remove
              </Button>
            </Box>
          ))}
        </Stack>
      </Paper>
    </Box>
  )
}
