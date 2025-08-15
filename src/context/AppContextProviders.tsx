import { ConfigProvider } from "./ConfigContext"
import { AppStateProvider } from "./AppStateContext"
import { SearchStateProvider } from "./SearchStateContext"

export default function AppContextProviders(props: React.PropsWithChildren) {
  return (
    <ConfigProvider>
      <SearchStateProvider>
        <AppStateProvider>{props.children}</AppStateProvider>
      </SearchStateProvider>
    </ConfigProvider>
  )
}
