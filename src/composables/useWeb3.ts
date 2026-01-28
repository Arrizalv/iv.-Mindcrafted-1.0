import { ref, computed } from 'vue'
import { BrowserProvider, parseEther, formatEther } from 'ethers'

// Global State for Web3
const isMetaMaskInstalled = ref(false)
const isConnected = ref(false)
const walletAddress = ref<string | null>(null)
const balance = ref<string>('0')
const chainId = ref<number | null>(null)
const isProcessing = ref(false)
const transactionState = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
const transactionHash = ref<string | null>(null)
const errorMessage = ref<string | null>(null)

// Configuration
const COMMENT_PAYMENT_AMOUNT = '0.001' // ETH per comment
const RECEIVER_ADDRESS = '0x0000000000000000000000000000000000000000' // Replace with your wallet address

// Supported Networks (for testing)
const SUPPORTED_NETWORKS: Record<number, string> = {
    1: 'Ethereum Mainnet',
    5: 'Goerli Testnet',
    11155111: 'Sepolia Testnet',
    137: 'Polygon Mainnet',
    80001: 'Mumbai Testnet'
}

export function useWeb3() {
    // Check if MetaMask is installed
    const checkMetaMaskInstalled = (): boolean => {
        const { ethereum } = window as any
        isMetaMaskInstalled.value = Boolean(ethereum && ethereum.isMetaMask)
        return isMetaMaskInstalled.value
    }

    // Get the current network name
    const networkName = computed(() => {
        if (!chainId.value) return 'Unknown'
        return SUPPORTED_NETWORKS[chainId.value] || `Chain ID: ${chainId.value}`
    })

    // Shortened wallet address for display
    const shortAddress = computed(() => {
        if (!walletAddress.value) return ''
        return `${walletAddress.value.slice(0, 6)}...${walletAddress.value.slice(-4)}`
    })

    // Connect to MetaMask
    const connectWallet = async (): Promise<boolean> => {
        try {
            errorMessage.value = null

            if (!checkMetaMaskInstalled()) {
                errorMessage.value = 'MetaMask is not installed. Please install MetaMask extension.'
                return false
            }

            const { ethereum } = window as any
            const provider = new BrowserProvider(ethereum)

            // Request account access
            const accounts = await provider.send('eth_requestAccounts', [])

            if (accounts.length === 0) {
                errorMessage.value = 'No accounts found. Please connect your wallet.'
                return false
            }

            walletAddress.value = accounts[0]
            isConnected.value = true

            // Get network info
            const network = await provider.getNetwork()
            chainId.value = Number(network.chainId)

            // Get balance
            await updateBalance()

            // Setup event listeners
            setupEventListeners()

            return true
        } catch (error: any) {
            console.error('Error connecting wallet:', error)
            errorMessage.value = error.message || 'Failed to connect wallet'
            isConnected.value = false
            return false
        }
    }

    // Update wallet balance
    const updateBalance = async () => {
        if (!walletAddress.value) return

        try {
            const { ethereum } = window as any
            const provider = new BrowserProvider(ethereum)
            const balanceWei = await provider.getBalance(walletAddress.value)
            balance.value = formatEther(balanceWei)
        } catch (error) {
            console.error('Error fetching balance:', error)
        }
    }

    // Setup MetaMask event listeners
    const setupEventListeners = () => {
        const { ethereum } = window as any
        if (!ethereum) return

        // Account changed
        ethereum.on('accountsChanged', (accounts: string[]) => {
            if (accounts.length === 0) {
                disconnectWallet()
            } else {
                walletAddress.value = accounts[0] || null
                updateBalance()
            }
        })

        // Chain changed
        ethereum.on('chainChanged', (newChainId: string) => {
            chainId.value = parseInt(newChainId, 16)
            updateBalance()
        })
    }

    // Disconnect wallet (reset state)
    const disconnectWallet = () => {
        isConnected.value = false
        walletAddress.value = null
        balance.value = '0'
        chainId.value = null
    }

    // Pay for comment
    const payForComment = async (receiverAddress?: string): Promise<boolean> => {
        try {
            isProcessing.value = true
            transactionState.value = 'pending'
            errorMessage.value = null
            transactionHash.value = null

            if (!isConnected.value) {
                const connected = await connectWallet()
                if (!connected) {
                    transactionState.value = 'error'
                    return false
                }
            }

            const { ethereum } = window as any
            const provider = new BrowserProvider(ethereum)
            const signer = await provider.getSigner()

            // Create transaction
            const tx = await signer.sendTransaction({
                to: receiverAddress || RECEIVER_ADDRESS,
                value: parseEther(COMMENT_PAYMENT_AMOUNT)
            })

            transactionHash.value = tx.hash || null

            // Wait for transaction confirmation
            await tx.wait()

            transactionState.value = 'success'
            await updateBalance()

            return true
        } catch (error: any) {
            console.error('Payment error:', error)
            transactionState.value = 'error'

            // Handle user rejection
            if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
                errorMessage.value = 'Transaction was rejected by user'
            } else if (error.code === 'INSUFFICIENT_FUNDS') {
                errorMessage.value = 'Insufficient funds for transaction'
            } else {
                errorMessage.value = error.message || 'Transaction failed'
            }

            return false
        } finally {
            isProcessing.value = false
        }
    }

    // Reset transaction state
    const resetTransactionState = () => {
        transactionState.value = 'idle'
        transactionHash.value = null
        errorMessage.value = null
    }

    // Initialize - check if MetaMask is installed
    checkMetaMaskInstalled()

    return {
        // State
        isMetaMaskInstalled,
        isConnected,
        walletAddress,
        shortAddress,
        balance,
        chainId,
        networkName,
        isProcessing,
        transactionState,
        transactionHash,
        errorMessage,

        // Config
        COMMENT_PAYMENT_AMOUNT,

        // Methods
        checkMetaMaskInstalled,
        connectWallet,
        disconnectWallet,
        payForComment,
        resetTransactionState,
        updateBalance
    }
}
