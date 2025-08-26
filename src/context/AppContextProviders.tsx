import { ConfigProvider } from "@/context/ConfigContext"
import { AppStateProvider } from "@/context/AppStateContext"
import { SearchStateProvider } from "@/context/SearchStateContext"

export default function AppContextProviders(props: React.PropsWithChildren) {
  return (
    <ConfigProvider>
      <SearchStateProvider>
        <AppStateProvider>{props.children}</AppStateProvider>
      </SearchStateProvider>
    </ConfigProvider>
  )
}
