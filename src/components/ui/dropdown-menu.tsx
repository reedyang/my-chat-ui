import React, { useState, useRef, useEffect, createContext, useContext } from 'react'
import { ChevronDown } from 'lucide-react'

interface DropdownMenuProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: 'left' | 'right'
}

interface DropdownMenuItemProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

const DropdownContext = createContext<{ closeDropdown: () => void } | null>(null)

export function DropdownMenu({ trigger, children, align = 'left' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const closeDropdown = () => setIsOpen(false)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      
      {isOpen && (
        <DropdownContext.Provider value={{ closeDropdown }}>
          <div className={`absolute top-full mt-1 z-50 min-w-[200px] bg-popover border border-border rounded-lg shadow-lg py-1 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}>
            {children}
          </div>
        </DropdownContext.Provider>
      )}
    </div>
  )
}

export function DropdownMenuItem({ children, onClick, className = '' }: DropdownMenuItemProps) {
  const context = useContext(DropdownContext)

  const handleClick = () => {
    onClick?.()
    context?.closeDropdown()
  }

  return (
    <div
      onClick={handleClick}
      className={`px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors ${className}`}
    >
      {children}
    </div>
  )
} 