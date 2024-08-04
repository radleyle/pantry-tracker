"use client"

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
  const [quantity, setQuantity] = useState(1)
  const [alerts, setAlerts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortType, setSortType] = useState('name')

  const updateInventory = async () => {
    try {
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
        if (item.quantity > 0) {
          inventoryList.push(item)
        } else {
          deleteDoc(doc.ref)  // Automatically delete item with quantity 0
        }

        // Check expiration date
        if (data.expirationDate) {
          const expiration = new Date(data.expirationDate)
          if (expiration <= new Date()) {
            newAlerts.push(`${item.name} has expired!`)
          } else if ((expiration - new Date()) / (1000 * 60 * 60 * 24) <= 3) {
            newAlerts.push(`${item.name} is expiring soon!`)
          }
        }
      })

      setInventory(inventoryList)
      setAlerts(newAlerts)
    } catch (error) {
      console.error("Error updating inventory:", error)
    }
  }

  const addItem = async (item, expirationDate, quantityChange) => {
    try {
      if (quantityChange < 1) return; // Prevent adding items with quantity less than 1

      const docRef = doc(collection(firestore, 'inventory'), item)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        const newQuantity = Math.max((data.quantity || 0) + quantityChange, 0)
        if (newQuantity === 0) {
          await deleteDoc(docRef)
        } else {
          await setDoc(docRef, { 
            quantity: newQuantity, 
            expirationDate: expirationDate || null
          }, { merge: true })
        }
      } else {
        if (quantityChange >= 1) {
          await setDoc(docRef, { 
            quantity: quantityChange, 
            expirationDate: expirationDate || null
          })
        }
      }

      await updateInventory()
    } catch (error) {
      console.error("Error adding item:", error)
    }
  }

  const deleteItem = async (itemName) => {
    try {
      const docRef = doc(collection(firestore, 'inventory'), itemName)
      await deleteDoc(docRef)
      await updateInventory()
    } catch (error) {
      console.error("Error deleting item:", error)
    }
  }

  const removeItem = async (itemName) => {
    try {
      const docRef = doc(collection(firestore, 'inventory'), itemName)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const { quantity } = docSnap.data()
        if (quantity > 0) {
          const newQuantity = Math.max(quantity - 1, 0)
          if (newQuantity === 0) {
            await deleteDoc(docRef)
          } else {
            await setDoc(docRef, { quantity: newQuantity }, { merge: true })
          }
        }
      }

      await updateInventory()
    } catch (error) {
      console.error("Error removing item:", error)
    }
  }

  const handleOpen = () => setOpen(true)
  const handleClose = () => {
    setOpen(false)
    setItemName('')
    setExpirationDate('')
    setQuantity(1)
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
      bgcolor="#f5f5f5"
      p={2}
    >
      {/* Header */}
      <Box 
        display="flex" 
        alignItems="center" 
        p={2} 
        bgcolor="#ffffff" 
        color="#333333"
        borderBottom="1px solid #e0e0e0"
        position="relative"
        boxShadow="0 1px 3px rgba(0, 0, 0, 0.1)"
      >
        <Typography variant="h5" ml={2}>
          Radley's Choice
        </Typography>
      </Box>
      
      <Box 
        flex="1" 
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        gap={2}
      >
        {alerts.map((alert, index) => (
          <Alert severity="warning" key={index} sx={{ width: '100%', maxWidth: '600px', mb: 2 }}>
            {alert}
          </Alert>
        ))}
        <Modal open={open} onClose={handleClose}>
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            width={350}
            bgcolor="#ffffff"
            boxShadow={24}
            p={4}
            borderRadius={2}
          >
            <Typography variant="h6" component="h2" mb={2} color="#333333">
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
                InputProps={{ style: { color: '#333333' } }}
              />
              <TextField
                label="Expiration Date"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                InputProps={{ style: { color: '#333333' } }}
              />
              <TextField
                label="Quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(Number(e.target.value), 1))}
                fullWidth
                InputLabelProps={{ shrink: true }}
                InputProps={{ style: { color: '#333333' } }}
              />
              <Button 
                variant="contained" 
                onClick={async () => {
                  await addItem(itemName, expirationDate, quantity)
                  handleClose()
                }}
                fullWidth
                sx={{ backgroundColor: '#333333', color: '#ffffff' }}
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
          width="100%" 
          maxWidth="600px" 
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
              style: { color: '#333333' }
            }}
            sx={{ width: '70%', bgcolor: '#ffffff' }}
          />
          <Select
            value={sortType}
            onChange={(e) => setSortType(e.target.value)}
            sx={{ width: '25%', bgcolor: '#ffffff', color: '#333333' }}
          >
            <MenuItem value="name">Sort by Name</MenuItem>
            <MenuItem value="quantity">Sort by Quantity</MenuItem>
          </Select>
        </Box>
        <Button 
          variant="contained"
          onClick={handleOpen}
          sx={{ mb: 2, backgroundColor: '#333333', color: '#ffffff' }}
        >
          Add New Item
        </Button>
        <Paper elevation={3} sx={{ p: 2, width: '100%', maxWidth: '600px', backgroundColor: '#ffffff' }}>
          <Box 
            height="60px" 
            bgcolor="#333333"
            display="flex"
            alignItems="center"
            justifyContent="center"
            borderRadius="8px 8px 0 0"
            mb={2}
          >
            <Typography variant="h6" color="#ffffff">
              Inventory Items
            </Typography>
          </Box>
          <Stack spacing={1}>
            {filteredInventory.map(item => (
              <Box
                key={item.name}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                p={1}
                border="1px solid #e0e0e0"
                borderRadius="8px"
                bgcolor="#fafafa"
                gap={2}
              >
                <Typography variant="body1" color="#333333" flex="1">
                  {item.name}
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Button 
                    variant="outlined" 
                    onClick={() => item.quantity > 0 && removeItem(item.name)}
                    sx={{ backgroundColor: '#eeeeee', color: '#333333', borderColor: '#cccccc' }}
                  >
                    -
                  </Button>
                  <Typography variant="body1" color="#333333">{item.quantity}</Typography>
                  <Button 
                    variant="outlined" 
                    onClick={() => addItem(item.name, item.expirationDate, 1)}
                    sx={{ backgroundColor: '#eeeeee', color: '#333333', borderColor: '#cccccc' }}
                  >
                    +
                  </Button>
                </Box>
                <Button 
                  variant="outlined" 
                  onClick={() => deleteItem(item.name)}
                  sx={{ backgroundColor: '#ff0000', color: '#ffffff', borderColor: '#ff0000' }}
                >
                  Delete
                </Button>
              </Box>
            ))}
          </Stack>
        </Paper>
      </Box>
    </Box>
  )
}
