import { useEffect } from 'react'

export default function usePlaywriteFont(){
  useEffect(()=>{
    const id = 'playwrite-font-stylesheet'
    if(document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Playwrite+MX+Guides&display=swap'
    document.head.appendChild(link)

    return () => {
      const el = document.getElementById(id)
      if(el) el.remove()
    }
  }, [])
}
