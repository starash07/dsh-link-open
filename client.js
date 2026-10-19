window.__ModuleLoader__.load({
  id: 'dsh-link-open',
  factory: () => {
    const CSS = '.dshlo-menu{position:fixed;z-index:2147483647;min-width:180px;padding:4px;background:var(--dsw-alias-bg-layer-2,#fff);color:var(--dsw-alias-label-primary,#161616);border:1px solid var(--dsw-alias-border-l2,#ddd);border-radius:7px;box-shadow:0 5px 16px #00000029;font:13px/18px system-ui,sans-serif}.dshlo-item{box-sizing:border-box;width:100%;height:30px;padding:0 8px;text-align:left;white-space:nowrap;color:inherit;background:transparent;border:0;border-radius:5px;cursor:pointer;display:flex;align-items:center;gap:8px}.dshlo-item:hover,.dshlo-item:focus-visible{background:var(--dsw-alias-interactive-bg-hover,#0000000f);outline:none}'

    function apply(ctx) {
      const style = document.createElement('style')
      style.setAttribute('data-dsh-link-open', '')
      style.textContent = CSS
      document.head.appendChild(style)

      let menu = null

      const close = () => {
        if (menu !== null) {
          menu.remove()
          menu = null
        }
      }

      const openExternally = (url) => {
        return fetch('/dsh-link-open/open-url', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ url }),
        }).then(response => response.ok, () => false)
      }

      const copyText = async (text) => {
        try {
          if (navigator.clipboard !== undefined && typeof navigator.clipboard.writeText === 'function') {
            await navigator.clipboard.writeText(text)
            return true
          }
        } catch {}
        return false
      }

      const placeMenu = (x, y) => {
        const width = 200
        const height = 76
        const left = Math.min(x, Math.max(8, window.innerWidth - width - 8))
        const top = Math.min(y, Math.max(8, window.innerHeight - height - 8))
        return { left: left + 'px', top: top + 'px' }
      }

      const showMenu = (event, href) => {
        close()
        menu = document.createElement('div')
        menu.className = 'dshlo-menu'
        menu.setAttribute('data-dsh-link-open', '')
        Object.assign(menu.style, placeMenu(event.clientX, event.clientY))

        const openItem = document.createElement('button')
        openItem.type = 'button'
        openItem.className = 'dshlo-item'
        openItem.textContent = '在默认浏览器中打开'
        openItem.addEventListener('click', () => {
          close()
          openExternally(href)
        })

        const copyItem = document.createElement('button')
        copyItem.type = 'button'
        copyItem.className = 'dshlo-item'
        copyItem.textContent = '复制链接'
        copyItem.addEventListener('click', () => {
          close()
          copyText(href)
        })

        menu.appendChild(openItem)
        menu.appendChild(copyItem)
        document.body.appendChild(menu)
        openItem.focus()
      }

      const onContextMenu = (event) => {
        const target = event.target instanceof Element ? event.target : null
        if (target === null) return
        const anchor = target.closest('a[href]')
        if (anchor === null) return
        const href = anchor.href
        if (!/^https?:/i.test(href)) return
        event.preventDefault()
        event.stopPropagation()
        showMenu(event, href)
      }

      const onPointerDown = (event) => {
        if (menu !== null && !menu.contains(event.target)) close()
      }

      const onKeyDown = (event) => {
        if (event.key === 'Escape') close()
      }

      const cleanup = () => {
        close()
        style.remove()
        document.removeEventListener('contextmenu', onContextMenu, true)
        document.removeEventListener('pointerdown', onPointerDown, true)
        document.removeEventListener('keydown', onKeyDown, true)
      }

      document.addEventListener('contextmenu', onContextMenu, true)
      document.addEventListener('pointerdown', onPointerDown, true)
      document.addEventListener('keydown', onKeyDown, true)
      ctx.effect(() => cleanup)
    }

    return { name: 'dsh-link-open', inject: [], apply }
  },
})
